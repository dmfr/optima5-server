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
					'<tpl if="headerColor">',
						'<div class="op5-crmbase-filecalendar-eventdetail-account" style="background-color:{headerColor}">',
							'{[typeof values.headerTxt !== "undefined" ? values.headerTxt : "&#160;"]}',
						'</div>',
					'</tpl>',
					
					'<div class="op5-crmbase-filecalendar-eventdetail-timewrap">',
						'<div class="op5-crmbase-filecalendar-eventdetail-timedone {[values.isDone ? "op5-crmbase-filecalendar-eventdetail-timedoneicon" : ""]}">&#160;</div>',
						'<div style="position:relative;">',
							'<span class="op5-crmbase-filecalendar-eventdetail-timelabel">Start:</span>',
							'<span class="op5-crmbase-filecalendar-eventdetail-timevalue">{startTxt}</span>',
						'</div>',
						'<div style="position:relative;">',
							'<span class="op5-crmbase-filecalendar-eventdetail-timelabel">End:</span>',
							'<span class="op5-crmbase-filecalendar-eventdetail-timevalue">{startTxt}</span>',
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

	update: function(filerecordId) {
		this.filerecordId = filerecordId;
		this.refresh();
	},

	refresh: function() {
		if (!this.rendered) {
			return;
		}
		
		var sampleTplData = {
			isDone:true,
			headerColor:'#86a723',
			headerTxt:'<b>PFF03</b> Julien CASTRO',
			startTxt:'11511/8416851',
			endTxt:'51515/4844848448',
			crmFields:[{
				fieldLabel: 'Magasin',
				fieldValue: '<b>3305556665</b> CARREFOUR CHELLES'
			},{
				fieldLabel: 'Type Evt',
				fieldValue: '<b>VISIT</b> Rdv Visite'
			}]
		} ;
		
		this.tpl.overwrite(this.el, sampleTplData);
		this.fireEvent('eventdetailrendered', this, null );
	},

	getTemplateEventData: function(evt) {
		var data = this.view.getTemplateEventData(evt);
		data._elId = 'dtl-' + data._elId;
		return data;
	}
}) ;