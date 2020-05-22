import { Component, OnInit, ElementRef, ViewEncapsulation, Input, SimpleChanges, OnChanges, ChangeDetectorRef } from '@angular/core';

import * as d3 from 'd3';
import * as topojson from 'topojson';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { tap, catchError, finalize, filter, delay } from 'rxjs/operators';

export class DonutChartDatum {
  code: string;
  displayValue: string;
  count: number;
}

@Component({
  selector: 'app-unitedstates-map',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './unitedstates-map.component.html',
  styleUrls: ['./unitedstates-map.component.scss']
})
export class UnitedStatesMapComponent implements OnInit {

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

  width = this.w.innerWidth || this.el.clientWidth || this.body.clientWidth;
  height = this.w.innerHeight || this.el.clientHeight || this.body.clientHeight;

  centered;

  legendContainerSettings = {
    x: this.width * 0.03,
    y: this.height * 0.82,
    width: 350,
    height: 90,
    roundX: 10,
    roundY: 10
  };
  legendBoxSettings = {
    width: 50,
    height: 15,
    y: this.legendContainerSettings.y + 55
  };

  zoomSettings = {
    duration: 1000,
    ease: d3.easeCubicOut,
    zoomLevel: 5
  };

  formatDecimal = d3.format('.1f');
  legendContainer;

  legendData = [0, 0.2, 0.4, 0.6, 0.8, 1];

  counties: any[] = [];
  legendLabels: any[] = [];
  meanDensity;
  scaleDensity;


  color = d3.scaleSequential(d3.interpolateReds);

  private _routerSub = Subscription.EMPTY;

  tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);


  constructor(private elRef: ElementRef, public router: Router, public route: ActivatedRoute, private changeDetectorRef: ChangeDetectorRef) {
    this.hostElement = this.elRef.nativeElement;

    this._routerSub = router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.route.params.subscribe(params => {
        if (this.router.url === '/unitedstates') {
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
    let viewBoxHeight = 200;
    let viewBoxWidth = 200;

    this.projection = d3.geoAlbersUsa();

    this.path = d3.geoPath()
      .projection(this.projection);

    this.svg = d3.select(this.hostElement).append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      //.attr('viewBox', '0 0 ' + viewBoxWidth + ' ' + viewBoxHeight);

    var that = this;

    this.svg.append('rect')
      .attr('class', 'background')
      .attr('width', '100%')
      .attr('height', '100%')
      .on('click', function (d) {
        that.clicked(d, that);
      });
   
    this.g = this.svg.append('g')
      .attr("transform", "translate(0,0)");


    d3.json("./assets/final.json")
      .then(function (data) {

        that.counties = topojson.feature(data, data.objects.counties).features;

        var meanDensity = d3.mean(that.counties, function (d: any) {
          return d.properties.density;
        });

        that.scaleDensity = d3.scaleQuantize()
          .domain([0, meanDensity])
          .range([0, 0.2, 0.4, 0.6, 0.8, 1]);

        that.legendLabels = [
          '<' + that.getPopDensity(0),
          '>' + that.getPopDensity(0),
          '>' + that.getPopDensity(0.2),
          '>' + that.getPopDensity(0.4),
          '>' + that.getPopDensity(0.6),
          '>' + that.getPopDensity(0.8)
        ];


        that.g
          .attr('class', 'county')
          .selectAll('path')
          .data(that.counties)
          .enter()
          .append('path')
        
          .attr('d', that.path)

          .attr('class', 'county')
          .attr('stroke', 'grey')
          .attr('stroke-width', 0.3)
          .attr('cursor', 'pointer')
          .attr('fill', function (d) {
            var countyDensity = d.properties.density;
            var density = countyDensity ? countyDensity : 0;
            return that.color(that.scaleDensity(density))
          })
          .on('click', function (d) {
            that.clicked(d, that);
          })
          .on('mouseover', function (d) {
            that.tooltip.transition()
              .duration(200)
              .style('opacity', .9);

            that.tooltip.html(d.properties.county + '<br/>' + d.properties.density)
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
            'font-size', 16)
          .style(
            'font-weight', 'bold')
          .text('Population Density by County (pop/square mile)');
      });
  }

  getPopDensity(rangeValue) {
    return this.formatDecimal(this.scaleDensity.invertExtent(rangeValue)[1]);
  }

  clicked(d, p) {
    var x;
    var y;
    var zoomLevel;

    if (d && p.centered !== d) {
      var centroid = p.path.centroid(d);
      x = centroid[0];
      y = centroid[1];
      zoomLevel = p.zoomSettings.zoomLevel;
      p.centered = d;

    } else {
      x = p.width / 2;
      y = p.height / 2;
      zoomLevel = 1;
      p.centered = null;
    }

    p.g.transition()
      .duration(p.zoomSettings.duration)
      .ease(p.zoomSettings.ease)
      .attr('transform', 'translate(' + p.width / 2 + ',' + p.height / 2 + ')scale(' + zoomLevel + ')translate(' + -x + ',' + -y + ')');

  }
}
