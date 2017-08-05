'use strict';

/**
 * `time-series-request` is a custom component which provides a modal dialog
 * to request a time series.
 *
 * Props
 * -----
 *
 * You need to set the following attributes,
 *  - `name`
 *  - `show-dialog`
 *  - `id-prefix`
 *
 * ### name
 *
 * Name of the time series to be requested.
 * `name` is displayed in the title of the modal dialog.
 *
 * ### show-dialog
 *
 * `show-dialog` should be a dynamic attribute, which shows / hides the modal
 * dialog.
 *
 * `show-dialog` should be a `Boolean` and when it is updated the visibility of
 * the modal dialog changes as described below,
 *  - `false` --> `true`: the modal dialog becomes visible
 *  - `true` --> `false`: the modal dialog becomes invisible
 *
 * ### id-prefix
 *
 * `id-prefix` is a string which is to be prepended to ID attributes of elements
 * in the template.
 *
 * You should set `id-prefix` so that the following IDs become unique.
 *  - `${id-prefix}-request-dialog`
 *  - `${id-prefix}-request-dialog-title`
 *  - `${id-prefix}-year`
 *  - `${id-prefix}-month`
 *  - `${id-prefix}-day`
 *  - `${id-prefix}-start-hour`
 *  - `${id-prefix}-start-minute`
 *  - `${id-prefix}-stop-hour`
 *  - `${id-prefix}-stop-minute`
 *
 * Events
 * ------
 *
 * This component can emit the following events,
 *  - `time-series-request-confirmed`
 *  - `time-series-request-cancelled`
 *
 * It is the parent's responsibility to close the modal dialog.
 * You can set the `show-dialog` attribute to `false`, in your event listener.
 *
 * ### time-series-request-confirmed
 *
 * Emitted when the request is confirmed.
 *
 * The following argument is passed to a listener,
 *  - `timeSpan`:
 *    Time span that the user has filled on the modal dialog.
 *    An object with the following fields,
 *     - `year`:
 *       Requested year.
 *     - `month`:
 *       Requested month. 
 *     - `day`:
 *       Requested day.
 *     - `startHour`:
 *       Hour part of the beginning of the requested time span.
 *     - `startMinute`:
 *       Minute part of the beginning of the requested time span.
 *     - `stopHour`:
 *       Hour part of the end of the requested time span.
 *     - `stopMinute`:
 *       Minute part of the end of the requested time span.
 *
 * ### time-series-request-cancelled
 *
 * Emitted when the request is cancelled.
 *
 * No arguments are given to a listener.
 *
 * Note
 * ----
 *
 * This component depends on Bootstrap to render a modal dialog.
 * You need to import Bootstrap CSS and JavaScript before this script.
 *
 */
Vue.component('time-series-request', {
	props: {
		showDialog: Boolean,
		name: String,
		idPrefix: String
	},
	template:
`<div v-bind:id='makeId("request-dialog")' class='modal fade' tabindex='-1'
    role='dialog' v-bind:aria-labelledby='makeId("request-dialog-title")'>
  <div class='modal-dialog' role='document'>
    <div class='modal-content'>
      <div class='modal-header'>
        <button type='button' class='close' aria-label='Close' v-on:click='cancelRequest'><span aria-hidden='true'>&times;</span></button>
        <h4 id='makeId("request-dialog-title")' class='modal-title'>Request {{ name }}</h4>
      </div>
      <div class='modal-body'>
        <form v-on:submit.prevent='requestHeartRate'>
          <label v-bind:for='makeId("year")'>Year</label>
		  <select v-bind:id='makeId("year")' class='form-control'
			  v-model='timeSpan.year'>
			<option v-for='year in yearOptions'
			    v-bind:value='year'>{{ year }}</option>
		  </select>
          <label v-bind:for='makeId("month")'>Month</label>
		  <select v-bind:id='makeId("month")' class='form-control'
		      v-model='timeSpan.month'>
			<option v-for='month in monthOptions'
			    v-bind:value='month'>{{ month }}</option>
		  </select>
          <label v-bind:for='makeId("day")'>Day</label>
		  <select v-bind:id='makeId("day")' class='form-control'
			  v-model='timeSpan.day'>
			<option v-for='day in dayOptions'
				v-bind:value='day'>{{ day }}</option>
		  </select>
          <label v-bind:for='makeId("start-hour")'>Start hour</label>
		  <select v-bind:id='makeId("start-hour")' class='form-control'
		      v-model='timeSpan.startHour'>
			<option v-for='hour in hourOptions'
			    v-bind:value='hour'>{{ hour }}</option>
		  </select>
          <label v-bind:for='makeId("start-minute")'>Start minute</label>
		  <select v-bind:id='makeId("start-minute")' class='form-control'
		      v-model='timeSpan.startMinute'>
		    <option v-for='minute in minuteOptions'
			    v-bind:value='minute'>{{ minute }}</option>
		  </select>
          <label v-bind:for='makeId("stop-hour")'>Stop hour</label>
		  <select v-bind:id='makeId("stop-hour")' class='form-control'
		      v-model='timeSpan.stopHour'>
		    <option v-for='hour in hourOptions'
			    v-bind:value='hour'>{{ hour }}</option>
		  </select>
          <label v-bind:for='makeId("stop-minute")'>Stop minute</label>
		  <select v-bind:id='makeId("stop-minute")' class='form-control'
		      v-model='timeSpan.stopMinute'>
		    <option v-for='minute in minuteOptions'
			    v-bind:value='minute'>{{ minute }}</option>
		  </select>
        </form>
      </div>
      <div class='modal-footer'>
        <button type='button' class='btn btn-default' v-on:click='cancelRequest'>Cancel</button>
        <button type='button' class='btn btn-primary' v-on:click='requestTimeSeries'>Request</button>
      </div>
    </div>
  </div>
</div>`,
	data: function () {
		const today = new Date();
		return {
			timeSpan: {
				year: today.getFullYear(),
				month: zeroPad(today.getMonth() + 1),  // getMonth returns 0-11
				day: zeroPad(today.getDate()),
				startHour: zeroPad(today.getHours()),
				startMinute: zeroPad(today.getMinutes()),
				stopHour: zeroPad(today.getHours()),
				stopMinute: zeroPad(today.getMinutes())
			},
			yearOptions: range(2007, today.getFullYear() + 1),
			monthOptions: range(1, 13).map(zeroPad),
			dayOptions: range(1, 32).map(zeroPad),
			hourOptions: range(0, 24).map(zeroPad),
			minuteOptions: range(0, 60).map(zeroPad)
		};

		// returns an array of numbers in a given range.
		function range(start, stop) {
			return Array.apply(0, Array(stop - start)).map((_, i) => {
				return start + i;
			});
		}

		// zero-pads a given number
		// x must be an integer >= 0 and < 100.
		function zeroPad(x) {
			return x < 10 ? `0${x}` : `${x}`;
		}
	},
	methods: {
		makeId: function (suffix) {
			return `${this.idPrefix}-${suffix}`;
		},
		requestTimeSeries: function () {
			this.$emit(
				'time-series-request-confirmed', $.extend({}, this.timeSpan));
		},
		cancelRequest: function () {
			this.$emit('time-series-request-cancelled');
		}
	},
	watch: {
		showDialog: function (show) {
			if (show) {
				$('#' + this.makeId('request-dialog')).modal({
					show: true,
					backdrop: 'static',
					keyboard: false
				});
			} else {
				$('#' + this.makeId('request-dialog')).modal('hide');
			}
		}
	}
});

