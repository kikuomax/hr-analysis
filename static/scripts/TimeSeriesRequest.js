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
 *  - `time-series-request-canceled`
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
 * ### time-series-request-canceled
 *
 * Emitted when the request is canceled.
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
          <input v-bind:id='makeId("year")' class='form-control'
              v-model='timeSpan.year' placeholder='yyyy' size='4'>
          <label v-bind:for='makeId("month")'>Month</label>
          <input v-bind:id='makeId("month")' class='form-control'
              v-model='timeSpan.month' placeholder='mm' size='2'>
          <label v-bind:for='makeId("day")'>Day</label>
          <input v-bind:id='makeId("day")' class='form-control'
              v-model='timeSpan.day' placeholder='dd' size='2'>
          <label v-bind:for='makeId("start-hour")'>Start hour</label>
          <input v-bind:id='makeId("start-hour")' class='form-control'
              v-model='timeSpan.startHour' placeholder='HH' size='2'>
          <label v-bind:for='makeId("start-minute")'>Start minute</label>
          <input v-bind:id='makeId("start-minute")' class='form-control'
              v-model='timeSpan.startMinute' placeholder='MM' size='2'>
          <label v-bind:for='makeId("stop-hour")'>Stop hour</label>
          <input v-bind:id='makeId("stop-hour")' class='form-control'
              v-model='timeSpan.stopHour' placeholder='HH' size='2'>
          <label v-bind:for='makeId("stop-minute")'>Stop minute</label>
          <input v-bind:id='makeId("stop-minute")' class='form-control'
              v-model='timeSpan.stopMinute' placeholder='MM' size='2'>
          <label for='submit-request' class='sr-only'>Submit</label>
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
		return {
			timeSpan: {
				year: '',
				month: '',
				day: '',
				startHour: '',
				startMinute: '',
				stopHour: '',
				stopMinute: ''
			}
		};
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
			this.$emit('time-series-request-canceled');
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

