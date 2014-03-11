Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoCalendarEventDetailView',{
	extend:'Ext.Component',
	
	requires: [
		'Ext.XTemplate'
	],
	
	initComponent : function(){
		this.callParent(arguments);
		this.addEvents({
			eventsrendered: true
		});
		
		var me = this ;
		if( (me.promoPanelCalendar) instanceof Optima5.Modules.Spec.WbMrfoxy.PromoCalendarSubpanel ) {} else {
			Optima5.Helper.logError('MrFoxy:FilePanelEventDetailView','No FilePanelCalendar reference ?') ;
		}
		me.on('destroy',function(thisview) {
			delete thisview.promoPanelCalendar ;
		},me) ;
		
		/*
		 * Mapping de répartition des champs :
		 * - Account 
		 * - Event (start/end)
		 * - CRM
		 * pour mise en page
		 */
		var tplMapping = {
				accountField: null,
				accountSrcValue: null,
				colorField: null,
				startField: null,
				endField: null,
				isDoneField: null,
				
				crmFields: []
		} ;
		
		tplMapping.accountField='store_node' ;
		tplMapping.accountSrcValue='store_text' ;
		tplMapping.startField = 'date_start' ;
		tplMapping.endField = 'date_end' ;
		tplMapping.lengthWeeksField = 'date_length_weeks' ;
		tplMapping.colorField = 'prod_color' ;
		
		tplMapping.crmFields = [
			{fieldLabel: 'Products', fieldSrcValue:'prod_text'},
			{fieldLabel: 'Mechanics', fieldSrcValue:'mechanics_text'}
		] ;
		
		me.tplMapping = tplMapping ;
	},

	afterRender: function() {
		this.tpl = this.getTemplate();

		this.callParent(arguments);
	},

	getTemplate: function() {
		if (!this.tpl) {
			this.tpl = new Ext.XTemplate(
				'<div class="op5-crmbase-filecalendar-eventdetail">',
					'<tpl if="headerColor">',
						'<div class="op5-crmbase-filecalendar-eventdetail-account" style="background-color:{headerColor}">',
							'{[ values.headerTxt != null ? values.headerTxt : "&#160;"]}',
						'</div>',
					'</tpl>',
					
					'<div class="op5-crmbase-filecalendar-eventdetail-timewrap">',
						'<div class="op5-crmbase-filecalendar-eventdetail-timedone {[values.isDone ? "op5-crmbase-filecalendar-eventdetail-timedoneicon" : ""]}">&#160;</div>',
						'<div style="position:relative;">',
							'<span class="op5-crmbase-filecalendar-eventdetail-timelabel">Start:</span>',
							'<span class="op5-crmbase-filecalendar-eventdetail-timevalue">{startTxt}</span>',
						'</div>',
						'<div style="position:relative;">',
							'<span class="op5-crmbase-filecalendar-eventdetail-timelabel">Leng:</span>',
							'<span class="op5-crmbase-filecalendar-eventdetail-timevalue">{lengthWeeks} week(s)</span>',
						'</div>',
					'</div>',
					
					'<tpl if="crmFields">',
						'<table class="op5-crmbase-filecalendar-eventdetail-tbl" cellpadding="0" cellspacing="0">',
						'<tpl for="crmFields">',
							'<tr>',
								'<td class="op5-crmbase-filecalendar-eventdetail-tdlabel">{fieldLabel}</td>',
								'<td class="op5-crmbase-filecalendar-eventdetail-tdvalue">{fieldValue}</td>',
							'</tr>',
						'</tpl>',
						'</table>',
					'</tpl>',
				'</div>'
			);
		}
		this.tpl.compile();
		return this.tpl;
	},

	update: function(evtId) {
		this.evtId = evtId;
		this.refresh();
	},

	refresh: function() {
		if (!this.rendered) {
			return;
		}
		if( this.evtId == null ) {
			return ;
		}
		
		var filerecord = this.promoPanelCalendar.dataCacheArray[this.evtId],
			tplMapping = this.tplMapping ;
		
		var tRenderer = function( tFilerecord, tSrcValue ) {
			return '' + tFilerecord[tSrcValue] + '' ;
		}
		
		var sampleTplData = {
			isDone: false,
			headerColor: null ,
			headerTxt: ( tplMapping.accountSrcValue != null ? tRenderer(filerecord,tplMapping.accountSrcValue) : null ),
			startTxt: Ext.Date.format( Ext.Date.parse(filerecord[tplMapping.startField], "Y-m-d", true), "Y-m-d" ) ,
			lengthWeeks: filerecord[tplMapping.lengthWeeksField] ,
			crmFields:[]
		} ;
		
		if( tplMapping.colorField ) {
			sampleTplData.headerColor = filerecord[tplMapping.colorField] ;
		}
		
		for( var i=0 ; i<tplMapping.crmFields.length ; i++ ) {
			sampleTplData.crmFields.push({
				fieldLabel: tplMapping.crmFields[i].fieldLabel,
				fieldValue: tRenderer(filerecord,tplMapping.crmFields[i].fieldSrcValue)
			}) ;
		}
		
		this.tpl.overwrite(this.el, sampleTplData);
		this.fireEvent('eventdetailrendered', this, null );
	},

	getTemplateEventData: function(evt) {
		var data = this.view.getTemplateEventData(evt);
		data._elId = 'dtl-' + data._elId;
		return data;
	}
}) ;