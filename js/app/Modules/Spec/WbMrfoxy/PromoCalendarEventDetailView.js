Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoCalendarEventDetailView',{
	extend:'Ext.Component',
	
	requires: [
		'Ext.XTemplate'
	],
	
	// private
	promoListRowPanel: null,
	
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
			thisview.cleanupPromoListRowPanel() ;
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
		tplMapping.progressPercent = 'status_percent' ;
		tplMapping.progressText = 'status_text' ;
		
		tplMapping.crmFields = [
			{fieldLabel: 'Stores', fieldSrcValue:'store_text'},
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
				'<div class="op5-spec-mrfoxy-schdetail">',
					'<tpl if="headerColor">',
						'<div class="op5-crmbase-filecalendar-eventdetail-account" style="background-color:{headerColor}">',
							'{[ values.headerTxt != null ? values.headerTxt : "&#160;"]}',
						'</div>',
					'</tpl>',
					
					'<div class="op5-spec-mrfoxy-schdetail-inline">',
					'<div class="op5-spec-mrfoxy-schdetail-inline-tbl">',
						'<div class="op5-spec-mrfoxy-schdetail-inline-elem">',
							'<div class="op5-crmbase-filecalendar-eventdetail-timewrap op5-spec-mrfoxy-schdetail-timewrap">',
								'<div style="position:relative;">',
									'<span class="op5-crmbase-filecalendar-eventdetail-timelabel">Start:</span>',
									'<span class="op5-crmbase-filecalendar-eventdetail-timevalue">{startTxt}</span>',
								'</div>',
								'<div style="position:relative;">',
									'<span class="op5-crmbase-filecalendar-eventdetail-timelabel">Leng:</span>',
									'<span class="op5-crmbase-filecalendar-eventdetail-timevalue">{lengthWeeks} week(s)</span>',
								'</div>',
							'</div>',
						'</div>',
						
						'<tpl if="crmFields">',
						'<div class="op5-spec-mrfoxy-schdetail-inline-elem">',
							'<table class="op5-spec-mrfoxy-schdetail-tbl" cellpadding="0" cellspacing="0">',
							'<tpl for="crmFields">',
								'<tr>',
									'<td class="op5-spec-mrfoxy-schdetail-tdlabel">{fieldLabel}</td>',
									'<td class="op5-spec-mrfoxy-schdetail-tdvalue">{fieldValue}</td>',
								'</tr>',
							'</tpl>',
							'</table>',
						'</div>',
						'</tpl>',
						
						'<div class="op5-spec-mrfoxy-schdetail-inline-elem">',
							'<div class="op5-spec-mrfoxy-schdetail-progress-lib">Status :</div>',
							'<div class="op5-spec-mrfoxy-schdetail-progress">{progressMarkup}</div>',
						'</div>',
					'</div>',
					'</div>',
					
					'<div class="op5-spec-mrfoxy-schdetail-rowcnt">',
					'</div>',
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
		if (!this.rendered || !(this.getEl().dom) ) {
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
			crmFields:[],
			progressMarkup: ''
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
		
		// Progress markup
		var tmpProgress = filerecord[tplMapping.progressPercent] / 100 ;
		var tmpText = filerecord[tplMapping.progressText] ;
			var b = new Ext.ProgressBar({height: 15, cls: 'op5-spec-mrfoxy-promolist-progress'});
			b.updateProgress(tmpProgress,tmpText);
			v = Ext.DomHelper.markup(b.getRenderTree());
			b.destroy() ;
		sampleTplData.progressMarkup = v ;
		
		// Apply template
		this.tpl.overwrite(this.el, sampleTplData);
		
		/*
		 * PromoListRowPalel
		 * - destroy if exists
		 * - create panel
		 * - renderTo
		 */
		var promoListRowPanel = this.getPromoListRowPanel(filerecord),
					targetEl = Ext.DomQuery.selectNode('div.op5-spec-mrfoxy-schdetail-rowcnt', this.getEl().dom);
		promoListRowPanel.render( targetEl );
		
		this.fireEvent('eventdetailrendered', this, null );
	},

	getPromoListRowPanel: function( filerecord ) {
		this.cleanupPromoListRowPanel() ;
		
		this.promoListRowPanel = Ext.create('Optima5.Modules.Spec.WbMrfoxy.PromoListRowPanel', {
			forceFit: true,
			height: 190,
			rowRecord: Ext.create('WbMrfoxyPromoModel',filerecord),
			optimaModule: this.promoPanelCalendar.optimaModule,
			listeners:{
				datachanged: function() {
					this.promoPanelCalendar.reload(false) ;
				},
				editpromo: function(promoRecord) {
					this.promoPanelCalendar.parentBrowserPanel.fireEvent('editpromo',promoRecord) ;
				},
				scope:this
			}
		}) ;
		return this.promoListRowPanel ;
	},
	cleanupPromoListRowPanel: function() {
		if( this.promoListRowPanel != null ) {
			this.promoListRowPanel.destroy() ;
			this.promoListRowPanel = null ;
		}
	}
	
}) ;