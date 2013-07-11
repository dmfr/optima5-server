Ext.define('Optima5.Modules.CrmBase.FilePanelEventDetailView',{
	extend:'Ext.Component',
	
	requires: [
		'Ext.XTemplate'
	],
	
	initComponent : function(){
		this.callParent(arguments);
		console.log('create') ;
		
		/*
		 * Mapping de répartition des champs :
		 * - Account 
		 * - Event (start/end)
		 * - CRM
		 * pour mise en page
		 */
		
		this.addEvents({
			eventsrendered: true
		});
	},

	afterRender: function() {
		this.tpl = this.getTemplate();

		this.callParent(arguments);
	},

	getTemplate: function() {
		if (!this.tpl) {
			this.tpl = new Ext.XTemplate(
				'<div class="op5-crmbase-filecalendar-eventdetail">',
					'<div class="op5-crmbase-filecalendar-eventdetail-account" style="background-color:#86a723">PFF03 Julien Castro</div>',
				'<table class="op5-crmbase-filecalendar-eventdetail-tbl" cellpadding="0" cellspacing="0">',
				'<tr><td class="op5-crmbase-filecalendar-eventdetail-tdtitle">fdijfdjqzqzqzefdi</td><td>fdkfosfosdfsds</td></tr>',
				'</table>',
				'</div>'
				/*
					'<div class="ext-cal-mdv x-unselectable">',
						'<table class="ext-cal-mvd-tbl" cellpadding="0" cellspacing="0">',
							'<tbody>',
									'<tpl for=".">',
										'<tr><td class="ext-cal-ev">{markup}</td></tr>',
									'</tpl>',
							'</tbody>',
						'</table>',
					'</div>'*/
			);
		}
		this.tpl.compile();
		return this.tpl;
	},

	update: function(filerecordId) {
		this.filerecordId = filerecordId;
		this.refresh();
	},

	refresh: function() {
		if (!this.rendered) {
			return;
		}
		/*
		var eventTpl = this.view.getEventTemplate(),

		templateData = [],

		evts = this.store.queryBy(function(rec) {
			var thisDt = Ext.Date.clearTime(this.date, true).getTime(),
					recStart = Ext.Date.clearTime(rec.data[Ext.calendar.data.EventMappings.StartDate.name], true).getTime(),
					startsOnDate = (thisDt == recStart),
					spansDate = false;

			if (!startsOnDate) {
					var recEnd = Ext.Date.clearTime(rec.data[Ext.calendar.data.EventMappings.EndDate.name], true).getTime();
					spansDate = recStart < thisDt && recEnd >= thisDt;
			}
			return startsOnDate || spansDate;
		},
		this);

		evts.each(function(evt) {
			var item = evt.data,
			M = Ext.calendar.data.EventMappings;

			item._renderAsAllDay = item[M.IsAllDay.name] || Ext.calendar.util.Date.diffDays(item[M.StartDate.name], item[M.EndDate.name]) > 0;
			item.spanLeft = Ext.calendar.util.Date.diffDays(item[M.StartDate.name], this.date) > 0;
			item.spanRight = Ext.calendar.util.Date.diffDays(this.date, item[M.EndDate.name]) > 0;
			item.spanCls = (item.spanLeft ? (item.spanRight ? 'ext-cal-ev-spanboth':
			'ext-cal-ev-spanleft') : (item.spanRight ? 'ext-cal-ev-spanright': ''));

			templateData.push({
					markup: eventTpl.apply(this.getTemplateEventData(item))
			});
		},
		this);
		*/

		this.tpl.overwrite(this.el, {});
		this.fireEvent('eventdetailrendered', this, null );
	},

	getTemplateEventData: function(evt) {
		var data = this.view.getTemplateEventData(evt);
		data._elId = 'dtl-' + data._elId;
		return data;
	}
}) ;