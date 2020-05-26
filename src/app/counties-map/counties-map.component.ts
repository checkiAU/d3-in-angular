import { Component, OnInit, ElementRef, ViewEncapsulation, Input, SimpleChanges, OnChanges, ChangeDetectorRef } from '@angular/core';

import countiesdata from "./counties.json";
import * as coviddata from "./counties-covid.json";
import * as d3 from 'd3';
import * as topojson from 'topojson';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { tap, catchError, finalize, filter, delay } from 'rxjs/operators';
import { DrillDownService } from '../shared/drilldown.services';

import { Location } from '@angular/common';

@Component({
  selector: 'app-counties-map',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './counties-map.component.html',
  styleUrls: ['./counties-map.component.scss']

})
export class CountiesMapComponent implements OnInit {

  @Input() data: number[];
  hostElement; // Native element hosting the SVG container
  svg; // Top level SVG element
  g; // SVG Group element
  w = window;
  doc = document;
  el = this.doc.documentElement;
  body = this.doc.getElementsByTagName('body')[0];

  projection;
  path;

  width = 960;
  height = 500;


  centered;

  legendContainerSettings = {
    x: 0,
    y: this.height,
    width: 370,
    height: 75,
    roundX: 10,
    roundY: 10
  };

  legendBoxSettings = {
    width: 50,
    height: 15,
    y: this.legendContainerSettings.y + 35
  };

  zoom;
  active;

  zoomSettings = {
    duration: 1000,
    ease: d3.easeCubicOut,
    zoomLevel: 5
  };

  formatDecimal = d3.format(',.0f');
  legendContainer;

  legendData = [ 0.2, 0.4, 0.6, 0.8, 1];

  merged: any[] = [];
  covid: any[] = [];
  counties: any[] = [];
  c: any[] = [];
  legendLabels: any[] = [];
  meanCases;
  scaleCases;
  scaleCircle;
  selectedState;

  numBars = 6;
  start = 1;
  end;
  scale = "Sqrrt";
  type = "Filled";

  linearScale;
  colorScaleLinear;
  expScale;
  colorScaleExp;
  logScale;
  colorScaleLog;
  sqrtScale;
  colorScaleSqrt;

  public scaleButtons = [
    { text: "Sqrrt", selected: true },
    { text: "Linear" },
    { text: "Exponential" },
    { text: "Logarithmic" }
  ];

  public typeButtons = [
    { text: "Filled", selected: true },
    { text: "Bubble" }
  ];
  private _routerSub = Subscription.EMPTY;

  tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);


  constructor(private elRef: ElementRef, public router: Router, public route: ActivatedRoute, private changeDetectorRef: ChangeDetectorRef, private drillDownService: DrillDownService, private location: Location) {
    this.hostElement = this.elRef.nativeElement;

    this.location = location;

    this._routerSub = router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.route.params.subscribe(params => {
        this.selectedState = this.route.snapshot.params['selectedState'];
        if (this.route.snapshot.params['selectedType']) {
          var button = this.typeButtons.find(({ text }) => text === this.type);
          button.selected = false;
          this.type = this.route.snapshot.params['selectedType'];
          var button = this.typeButtons.find(({ text }) => text === this.type);
          button.selected = true;
        }

        if (this.route.snapshot.params['selectedScale']) {
          var button = this.scaleButtons.find(({ text }) => text === this.scale);
          button.selected = false;
          this.scale = this.route.snapshot.params['selectedScale'];
          var button = this.scaleButtons.find(({ text }) => text === this.scale);
          button.selected = true;
        }
        
        if (this.router.url.indexOf('/counties') != -1) {
          this.removeExistingMapFromParent();
          this.updateMap();
        }
      });
    });

  }

  ngOnInit() {

  }

  private removeExistingMapFromParent() {
    // !!!!Caution!!!
    // Make sure not to do;
    //     d3.select('svg').remove();
    // That will clear all other SVG elements in the DOM
    d3.select(this.hostElement).select('svg').remove();
  }



  updateMap() {


    this.active = d3.select(null);


    var that = this;

    this.zoom = d3.zoom()
      // no longer in d3 v4 - zoom initialises with zoomIdentity, so it's already at origin
      // .translate([0, 0]) 
      // .scale(1) 
      .scaleExtent([1, 8])
      .on("zoom", function (d) {
        that.zoomed(d, that)
      });

    this.projection = d3.geoAlbersUsa()
      .scale(1000)
      .translate([this.width / 2, this.height / 2]);

    this.path = d3.geoPath()
      .projection(this.projection);

    this.svg = d3.select(this.hostElement).append('svg')
      .attr('width', this.width)
      .attr('height', this.height + 75)
      .on("click", this.stopped, true);


    this.svg.append('rect')
      .attr('class', 'background')
      .attr('width', this.width)
      .attr('height', this.height)
      .on('click', function (d) {
        //  Don't zoom out when selecting rect
        // that.reset(d, that);
      });

    this.svg
      .call(this.zoom); // delete this line to disable free zooming

    this.g = this.svg.append('g');

    that.covid = coviddata.counties;
    //  });

    that.counties = topojson.feature(countiesdata, countiesdata.objects.collection).features;


    if (that.selectedState != 'All') {
      that.counties = that.counties.filter(function (d) { return d.properties.state === that.selectedState });

      if (that.drillDownService.x) {
        that.svg.transition()
          .duration(750)
          .call(that.zoom.transform, d3.zoomIdentity.translate(that.drillDownService.x, that.drillDownService.y).scale(that.drillDownService.scale))
      }
    }

    that.merged = that.join(that.covid, that.counties, "fips", "fips", function (county, covid) {
      return {
        name: county.properties.name,
        cases: (covid ? covid.cases : 0),
        geometry: county.geometry,
        type: county.type,
        state: county.properties.state
      };
    });

    that.merged = that.merged.sort((a, b) => a.cases > b.cases ? - 1 : (a.cases < b.cases ? 1  : 0));

    that.start = d3.min(that.merged, function (d: any) {
      return d.cases;
    });

    that.end = d3.max(that.merged, function (d: any) {
      return d.cases;
    });

    // Linear Scale
    switch (that.type) {
      case "Filled":
        that.linearScale = d3.scaleLinear()
          .domain([that.start, that.end])
          .range([0, 1]);
        break;
      case "Bubble":
        that.linearScale = d3.scaleLinear()
          .domain([that.start, that.end])
          .range([0, 8]);
        break;
    }

    that.colorScaleLinear = d3.scaleSequential(d =>
      d3.interpolateReds(that.linearScale(d))
    );

    // Exponential Scale
    switch (that.type) {
      case "Filled":
        that.expScale = d3
          .scalePow()
          .exponent(Math.E)
          .domain([that.start, that.end])
          .range([0, 1]);
        break;
      case "Bubble":
        that.expScale = d3
          .scalePow()
          .exponent(Math.E)
          .domain([that.start, that.end])
          .range([0, 8]);
        break;
    }

    that.colorScaleExp = d3.scaleSequential(d =>
      d3.interpolateReds(that.expScale(d))
    );

    // Log Scale
    switch (that.type) {
      case "Filled":
        that.logScale = d3.scaleLog().domain([that.start, that.end])
          .range([0, 1]);
        break;
      case "Bubble":
        that.logScale = d3.scaleLog().domain([that.start, that.end])
          .range([0, 8]);
        break;
    }

    that.colorScaleLog = d3.scaleSequential(d =>
      d3.interpolateReds(that.logScale(d))
    );

    // Sqrt Scale
    switch (that.type) {
      case "Filled":
        that.sqrtScale = d3.scaleSqrt().domain([that.start, that.end])
          .range([.1, 1]);
        break;
      case "Bubble":
        that.sqrtScale = d3.scaleSqrt().domain([that.start, that.end])
          .range([.1, 8]);
        break;
    }

    that.colorScaleSqrt = d3.scaleSequential(d =>
      d3.interpolateReds(that.sqrtScale(d))
    );
 
    switch (that.type) {
      case "Filled":
        that.legendLabels = [
          ">" + that.getCases(0),
          ">" + that.getCases(0.2),
          ">" + that.getCases(0.4),
          ">" + that.getCases(0.6),
          ">" + that.getCases(0.8)
        ];
        break;
      case "Bubble":
        that.legendLabels = [
          ">" + that.getCases(0 * 30),
          ">" + that.getCases(0.2 * 30),
          ">" + that.getCases(0.4 * 30),
          ">" + that.getCases(0.6 * 30),
          ">" + that.getCases(0.8 * 30)
        ];
        break;
    }

    that.g
      .attr('class', 'county')
      .selectAll('path')
      .data(that.merged)
      .enter()
      .append('path')
      .attr('d', that.path)
      .attr('class', 'county')
      .attr('stroke', 'grey')
      .attr('stroke-width', 0.3)
      .attr('cursor', 'pointer')
      .attr('fill', function (d) {
        var cases = d.cases;
        var cases = cases ? cases : 0;
        if (that.type == "Filled") {
          switch (that.scale) {
            case "Linear":
              return that.colorScaleLinear(cases);
            case "Exponential":
              return that.colorScaleExp(cases);
            case "Logarithmic":
              return that.colorScaleLog(cases);
            case "Sqrrt":
              return that.colorScaleSqrt(cases);
          }
        }
        else {
          return "#f2f2f2";
        }
      })
      //.on('click', function (d) {
      //  that.clicked(d, that);
      //})
      .on('mouseover', function (d) {
        that.tooltip.transition()
          .duration(200)
          .style('opacity', .9);

        that.tooltip.html(d.name + '<br/><b>Total Cases:</b> ' + that.formatDecimal(d.cases))
          .style('left', (d3.event.pageX) + 'px')
          .style('top', (d3.event.pageY) + 'px')

        that.changeDetectorRef.detectChanges();;
      })
      .on('mouseout', function (d) {
        that.tooltip.transition()
          .duration(300)
          .style('opacity', 0);

        that.changeDetectorRef.detectChanges();;
      });

    if (that.type == "Bubble") {
    that.g
      .attr("class", "bubble")
      .selectAll('circle')
      .data(that.merged)
      .enter().append("circle")
      .attr("transform", function (d) { return "translate(" + that.path.centroid(d) + ")"; })
      .attr("r", function (d) {
        switch (that.scale) {
          case "Linear":
            return that.linearScale(d.cases);
          case "Exponential":
            return that.expScale(d.cases);
          case "Logarithmic":
            return that.logScale(d.cases);
          case "Sqrrt":
            return that.sqrtScale(d.cases);
        }
      })
      .on('mouseover', function (d) {
           that.tooltip.transition()
             .duration(200)
             .style('opacity', .9);

           that.tooltip.html(d.name + '<br/><b>Total Cases:</b> ' + that.formatDecimal(d.cases))
             .style('left', (d3.event.pageX) + 'px')
             .style('top', (d3.event.pageY) + 'px')

           that.changeDetectorRef.detectChanges();;
         })
      .on('mouseout', function (d) {
        that.tooltip.transition()
          .duration(300)
          .style('opacity', 0);

        that.changeDetectorRef.detectChanges();;
      });

    }

    that.legendContainer = that.svg.append('rect')
      .attr('x', that.legendContainerSettings.x)
      .attr('y', that.legendContainerSettings.y)
      .attr('rx', that.legendContainerSettings.roundX)
      .attr('ry', that.legendContainerSettings.roundY)
      .attr('width', that.legendContainerSettings.width)
      .attr('height', that.legendContainerSettings.height)
      .attr('id', 'legend-container')

    var legend = that.svg.selectAll('g.legend')
      .data(that.legendData)
      .enter().append('g')
      .attr('class', 'legend');

    if (that.type == 'Filled') {
      legend
        .append("rect")
        .attr("x", function (d, i) {
          return (
            that.legendContainerSettings.x + that.legendBoxSettings.width * i + 20
          );
        })
        .attr("y", that.legendBoxSettings.y)
        .attr("width", that.legendBoxSettings.width)
        .attr("height", that.legendBoxSettings.height)
        .style("fill", function (d, i) {
          switch (that.scale) {
            case "Linear":
              return that.colorScaleLinear(that.linearScale.invert(d));
            case "Exponential":
              return that.colorScaleExp(that.expScale.invert(d));
            case "Logarithmic":
              return that.colorScaleLog(that.logScale.invert(d));
            case "Sqrrt":
              return that.colorScaleSqrt(that.sqrtScale.invert(d));
          }
        })
        .style("opacity", 1);

      legend
        .append("text")
        .attr("x", function (d, i) {
          return (
            that.legendContainerSettings.x + that.legendBoxSettings.width * i + 30
          );
        })
        .attr("y", that.legendContainerSettings.y + 72)
        .style("font-size", 12)
        .text(function (d, i) {
          return that.legendLabels[i];
        });
    }

    if (that.type == 'Bubble') {
      legend
        .append("circle")
        .attr("class", "bubble")
        .attr("cx", function (d, i) {
          return (
            that.legendContainerSettings.x + (that.legendBoxSettings.width + 20) * i + 20
          );
        })
        .attr("cy", that.legendBoxSettings.y)
        .attr("r", function (d, i) {
          d = d * 30;
          switch (that.scale) {
            case "Linear":
              return that.linearScale(that.linearScale.invert(d));
            case "Exponential":
              return that.expScale(that.expScale.invert(d));
            case "Logarithmic":
              return that.logScale(that.logScale.invert(d));
            case "Sqrrt":
              return that.sqrtScale(that.sqrtScale.invert(d));
          }
        })

      legend
        .append("text")
        .attr("x", function (d, i) {
          return (
            that.legendContainerSettings.x + (that.legendBoxSettings.width + 20) * i + 30
          );
        })
        .attr("y", that.legendContainerSettings.y + 72)
        .style("font-size", 12)
        .style("font-weight", "bold")
        .text(function (d, i) {
          return that.legendLabels[i];
        });
    }

    legend
      .append("text")
      .attr("x", that.legendContainerSettings.x + 13)
      .attr("y", that.legendContainerSettings.y + 14)
      .style("font-size", 14)
      .style("font-weight", "bold")
      .text("COVID-19 Cases by County (" + that.scale + ")");

  }

  getCases(rangeValue) {
    switch (this.scale) {
      case "Linear":
        return this.formatDecimal(this.linearScale.invert(rangeValue));
      case "Exponential":
        return this.formatDecimal(this.expScale.invert(rangeValue));
      case "Logarithmic":
        return this.formatDecimal(this.logScale.invert(rangeValue));
      case "Sqrrt":
        return this.formatDecimal(this.sqrtScale.invert(rangeValue));
    }
  }

  reset(d, p) {
    p.active.classed("active", false);
    p.active = d3.select(null);

    p.svg.transition()
      .duration(750)
      // .call( zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1) ); // not in d3 v4
      .call(p.zoom.transform, d3.zoomIdentity); // updated for d3 v4
  }

  // If the drag behavior prevents the default click,
  // also stop propagation so we don’t click-to-zoom.
  stopped() {
    if (d3.event.defaultPrevented) d3.event.stopPropagation();
  }

  zoomed(d, p) {
    p.g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
    // g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"); // not in d3 v4
    p.g.attr("transform", d3.event.transform); // updated for d3 v4
  }

  join(lookupTable, mainTable, lookupKey, mainKey, select) {
    var l = lookupTable.length,
      m = mainTable.length,
      lookupIndex = [],
      output = [];
    for (var i = 0; i < l; i++) { // loop through l items
      var row = lookupTable[i];
      lookupIndex[row[lookupKey]] = row; // create an index for lookup table
    }
    for (var j = 0; j < m; j++) { // loop through m items
      var y = mainTable[j];
      var x = lookupIndex[y.properties[mainKey]]; // get corresponding row from lookupTable
      output.push(select(y, x)); // select only the columns you need
    }
    return output;
  }

  selectedScaleChange(e, btn) {
    this.scale = btn.text;
    this.location.go('counties/' + this.selectedState + '/' + this.type + '/' + this.scale);
    this.removeExistingMapFromParent();
    this.updateMap();
  }

  selectedTypeChange(e, btn) {
    this.type = btn.text;
    this.location.go('counties/' + this.selectedState + '/' + this.type + '/' + this.scale);
    this.removeExistingMapFromParent();
    this.updateMap();
  }

}
