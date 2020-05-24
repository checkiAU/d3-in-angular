import { Component, OnInit, ElementRef, ViewEncapsulation, Input, SimpleChanges, OnChanges, ChangeDetectorRef } from '@angular/core';

import * as d3 from 'd3';
import * as topojson from 'topojson';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { tap, catchError, finalize, filter, delay } from 'rxjs/operators';
import { DrillDownService } from '../shared/drilldown.services';


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
    y: this.legendContainerSettings.y + 55
  };

  zoom;
  active;

  zoomSettings = {
    duration: 1000,
    ease: d3.easeCubicOut,
    zoomLevel: 5
  };

  formatDecimal = d3.format('.0f');
  legendContainer;

  legendData = [0, 0.2, 0.4, 0.6, 0.8, 1];

  merged: any[] = [];
  covid: any[] = [];
  counties: any[] = [];
  legendLabels: any[] = [];
  meanCases;
  scaleCases;
  selectedState;

 
  color = d3.scaleSequential(d3.interpolateReds);

  private _routerSub = Subscription.EMPTY;

  tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);


  constructor(private elRef: ElementRef, public router: Router, public route: ActivatedRoute, private changeDetectorRef: ChangeDetectorRef, private drillDownService: DrillDownService) {
    this.hostElement = this.elRef.nativeElement;

    this._routerSub = router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.route.params.subscribe(params => {
        this.selectedState = this.route.snapshot.params['selectedState'];
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

    d3.csv("./assets/us-counties.csv")
      .then(function (data) {
        that.covid = data;
      });

    d3.json("./assets/counties.json")
      .then(function (data) {

        that.counties = topojson.feature(data, data.objects.collection).features;

        that.merged = that.join(that.covid, that.counties, "fips", "fips", function (county, covid) {
          return {
            name: county.properties.name,
            cases: (covid ? covid.cases : 0),
            geometry: county.geometry,
            type: county.type,
            state: county.properties.state
          };
        });

        if (that.selectedState != 'All') {
          that.merged = that.merged.filter(function (d) { return d.state === that.selectedState });

          if (that.drillDownService.x) {
            that.svg.transition()
              .duration(750)
              .call(that.zoom.transform, d3.zoomIdentity.translate(that.drillDownService.x, that.drillDownService.y).scale(that.drillDownService.scale))
          }
        }

        var meanCases = d3.mean(that.merged, function (d: any) {
          return d.cases;
        });

        that.scaleCases = d3.scaleQuantize()
          .domain([0, meanCases])
          .range([0, 0.2, 0.4, 0.6, 0.8, 1]);

        that.legendLabels = [
          '<' + that.getCases(0),
          '>' + that.getCases(0),
          '>' + that.getCases(0.2),
          '>' + that.getCases(0.4),
          '>' + that.getCases(0.6),
          '>' + that.getCases(0.8)
        ];


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
            return that.color(that.scaleCases(cases))
          })
          //.on('click', function (d) {
          //  that.clicked(d, that);
          //})
          .on('mouseover', function (d) {
            that.tooltip.transition()
              .duration(200)
              .style('opacity', .9);

            that.tooltip.html(d.name + '<br/>' + d.cases)
              .style('left', (d3.event.pageX) + 'px')
              .style('top', (d3.event.pageY) + 'px');

            that.changeDetectorRef.detectChanges();;
          })
          .on('mouseout', function (d) {
            that.tooltip.transition()
              .duration(300)
              .style('opacity', 0);

            that.changeDetectorRef.detectChanges();;
          });;

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

        legend.append('rect')
          .attr(
            'x', function (d, i) {
              return that.legendContainerSettings.x + that.legendBoxSettings.width * i + 20;
            })
          .attr('y', that.legendBoxSettings.y)
          .attr('width', that.legendBoxSettings.width)
          .attr('height', that.legendBoxSettings.height)
          .style(
            'fill', function (d, i) {
              return that.color(d);
            })
          .style(
            'opacity', 1)

        legend.append('text')
          .attr(
            'x', function (d, i) {
              return that.legendContainerSettings.x + that.legendBoxSettings.width * i + 30;
            })
          .attr(
            'y', that.legendContainerSettings.y + 52
          )
          .style('font-size', 12)
          .text(function (d, i) {
            return that.legendLabels[i];
          });

        legend.append('text')
          .attr('x', that.legendContainerSettings.x + 13)
          .attr('y', that.legendContainerSettings.y + 29)
          .style(
            'font-size', 14)
          .style(
            'font-weight', 'bold')
          .text('Population Cases by County');

      });
  }

  getCases(rangeValue) {
    return this.formatDecimal(this.scaleCases.invertExtent(rangeValue)[1]);
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

}
