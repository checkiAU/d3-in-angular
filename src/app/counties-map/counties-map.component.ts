import { Component, OnInit, ElementRef, ViewEncapsulation, Input, SimpleChanges, OnChanges, ChangeDetectorRef, ViewChild, EventEmitter, Output } from '@angular/core';

import countiesdata from "../data/counties.json";
import * as coviddata from "../data/counties-historical.json";
import * as d3 from 'd3';
import * as topojson from 'topojson';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { tap, catchError, finalize, filter, delay } from 'rxjs/operators';
import { DrillDownService } from '../shared/drilldown.services';

import { Location } from '@angular/common';
import {
  formatDate
} from '@angular/common';
import { SliderComponent } from '@progress/kendo-angular-inputs';

@Component({
  selector: 'app-counties-map',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './counties-map.component.html',
  styleUrls: ['./counties-map.component.scss']

})
export class CountiesMapComponent implements OnInit {

  @ViewChild('slider', { static: true }) slider: SliderComponent;
  @Output() dateChanged = new EventEmitter<any>();

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
    width: 420,
    height: 75,
    roundX: 10,
    roundY: 10
  };

  legendBoxSettings = {
    width: 50,
    height: 15,
    y: this.legendContainerSettings.y + 38
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

  legendData = [0, 0.2, 0.4, 0.6, 0.8, 1];

  merged: any[] = [];
  covid: any[] = [];
  counties: any[] = [];
  c: any[] = [];
  legendLabels: any[] = [];
  scaleCircle;
  selectedState;

  numBars = 6;
  start = 1;
  end;
  scale = "Sqrrt";
  type = "Filled";
  metric = "Total Cases";
  date;
  dateMin = "2020-01-21";
  dateMax;
  tab = "Totals";


  linearScale;
  colorScaleLinear;
  expScale;
  colorScaleExp;
  logScale;
  colorScaleLog;
  sqrtScale;
  colorScaleSqrt;

  public scaleButtons = ["Sqrrt", "Linear", "Exponential", "Logarithmic"];


  public typeButtons = [
    { text: "Filled", selected: true },
    { text: "Bubble" }
  ];
  private _routerSub = Subscription.EMPTY;

  tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  /* slider */
  public tickPlacement: string = 'none';
  public value: number;
  public min: number;
  public max: number;
  public smallStep: number = 86400000;


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
          this.scale = this.route.snapshot.params['selectedScale'];
        }

        if (this.route.snapshot.params['selectedTab']) {
          this.tab = this.route.snapshot.params['selectedTab'];
        }

        if (this.route.snapshot.params['selectedMetric']) {
          this.metric = this.route.snapshot.params['selectedMetric'];
        }

        if (this.route.snapshot.params['selectedDate']) {
          this.date = this.route.snapshot.params['selectedDate'];
          var value = new Date(this.date);
          value.setHours(23, 59, 59, 999);
          this.value = value.getTime();
          this.slider.value = value.getTime();
        }
        else {
          this.date = formatDate(new Date().setDate(new Date().getDate() - 1), 'yyyy-MM-dd', 'en');
        }

        if (this.router.url.indexOf('/counties') != -1) {
          this.removeExistingMapFromParent();
          this.updateMap(true);
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



  updateMap(performZoom) {


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

    //this.svg
    // .call(this.zoom); // delete this line to disable free zooming

    this.g = this.svg.append('g');

    that.covid = coviddata.counties;

    that.dateMax = d3.max(that.covid, function (d: any) {
      return d.date
    });

    // Slider values
    that.min = new Date(that.dateMin).getTime();
    var max = new Date(that.dateMax);
    max.setHours(23, 59, 59, 999);
    that.max = max.getTime();

    // default to end date
    if (!that.date) {
      that.date = that.dateMax;
      that.slider.value = that.value;
    }

    // Set date to max date if no data available
    if (that.date > that.dateMax) {
      that.date = that.dateMax;
      that.value = that.max;
      this.location.go('counties/' + this.selectedState + '/' + this.type + '/' + this.scale + '/' + this.metric + '/' + this.date);
    }


    var covidMax = that.covid.filter(function (d) {
      return d.date === that.dateMax && d.state === that.selectedState
    });

    var covid = that.covid.filter(function (d) {
      return d.state === that.selectedState
    });

    that.start = 1;

    // Get data for max date

    switch (that.metric) {
      case "Daily Deaths":
        that.end = d3.max(covid, function (d: any) {
          return d.daily_deaths;
        })
        break;
      case "Daily Cases":
        that.end = d3.max(covid, function (d: any) {
          return d.daily_cases;
        })
        break;
      case "Total Cases":
        that.end = d3.max(covidMax, function (d: any) {
          return d.cases;
        })
        break;
      case "Total Deaths":
        that.end = d3.max(covidMax, function (d: any) {
          return d.deaths;
        })
        break;
    }

    // Get current date
    that.covid = that.covid.filter(function (d) {
      return d.date === that.date && d.state === that.selectedState
    });

    that.counties = topojson.feature(countiesdata, countiesdata.objects.collection).features;


    if (that.selectedState != 'All') {
      that.counties = that.counties.filter(function (d) { return d.properties.state === that.selectedState });

      if (that.drillDownService.x && performZoom) {
        that.svg.transition()
          .duration(750)
          .call(that.zoom.transform, d3.zoomIdentity.translate(that.drillDownService.x, that.drillDownService.y).scale(that.drillDownService.scale))
      }
      else {
        that.svg.transition()
          .duration(0)
          .call(that.zoom.transform, d3.zoomIdentity.translate(that.drillDownService.x, that.drillDownService.y).scale(that.drillDownService.scale))
      }

    }

    that.merged = that.join(that.covid, that.counties, "fips", "fips", function (county, covid) {

      var metric;
      switch (that.metric) {
        case "Total Cases":
          metric = covid ? covid.cases : 0;
          break;
        case "Total Deaths":
          metric = covid ? covid.deaths : 0;
          break;
        case "Daily Cases":
          metric = covid ? covid.daily_cases : 0;
          break;
        case "Daily Deaths":
          metric = covid ? covid.daily_deaths : 0;
          break;
      }

      return {
        name: county.properties.name,
        metric: metric,
        geometry: county.geometry,
        type: county.type,
        state: county.properties.state
      };
    });

    // Sort for bubble overlays
    that.merged = that.merged.sort((a, b) => a.metric > b.metric ? - 1 : (a.metric < b.metric ? 1 : 0));


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
          "<" + that.getMetrics(0),
          ">" + that.getMetrics(0),
          ">" + that.getMetrics(0.2),
          ">" + that.getMetrics(0.4),
          ">" + that.getMetrics(0.6),
          ">" + that.getMetrics(0.8)
        ];
        break;
      case "Bubble":
        that.legendLabels = [
          "<" + that.getMetrics(0 * 30),
          ">" + that.getMetrics(0 * 30),
          ">" + that.getMetrics(0.2 * 30),
          ">" + that.getMetrics(0.4 * 30),
          ">" + that.getMetrics(0.6 * 30),
          ">" + that.getMetrics(0.8 * 30)
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
        var metric = d.metric;
        var metric = metric ? metric : 0;
        if (that.type == "Filled" && metric > 0) {
          switch (that.scale) {
            case "Linear":
              return that.colorScaleLinear(metric);
            case "Exponential":
              return that.colorScaleExp(metric);
            case "Logarithmic":
              return that.colorScaleLog(metric);
            case "Sqrrt":
              return that.colorScaleSqrt(metric);
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

        that.tooltip.html(d.name + '<br/><b>Total ' + that.metric + ':</b> ' + that.formatDecimal(d.metric))
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
              return that.linearScale(d.metric);
            case "Exponential":
              return that.expScale(d.metric);
            case "Logarithmic":
              return that.logScale(d.metric);
            case "Sqrrt":
              return that.sqrtScale(d.metric);
          }
        })
        .on('mouseover', function (d) {
          that.tooltip.transition()
            .duration(200)
            .style('opacity', .9);

          that.tooltip.html(d.name + '<br/><b>Total ' + this.metric + ':</b> ' + that.formatDecimal(d.metric))
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
      .text("COVID-19 " + this.metric + ' by County (' + that.scale + ")");

  }

  getMetrics(rangeValue) {
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

  selectedScaleChange(value) {
    this.scale = value;
    this.location.go('counties/' + this.selectedState + '/' + this.type + '/' + this.scale + '/' + this.metric + '/' + this.date);
    this.removeExistingMapFromParent();
    this.updateMap(true);
  }

  selectedTypeChange(e, btn) {
    this.type = btn.text;
    this.location.go('counties/' + this.selectedState + '/' + this.type + '/' + this.scale + '/' + this.metric + '/' + this.date);
    this.removeExistingMapFromParent();
    this.updateMap(true);
  }

  valueChange(e) {
    this.value = e;
    this.date = formatDate(new Date(this.value), 'yyyy-MM-dd', 'en');
    this.location.go('counties/' + this.selectedState + '/' + this.type + '/' + this.scale + '/' + this.metric + '/' + this.date);
    this.dateChanged.emit(this.date);
    this.removeExistingMapFromParent();
    this.updateMap(false);
  }

}
