Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportUsersPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Ext.ux.CheckColumnNull',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',
		'Optima5.Modules.Spec.RsiRecouveo.SearchCombo',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamFilter',
		'Optima5.Modules.Spec.RsiRecouveo.MultiActionForm'
	],
	
	filters: {},
	autoRefreshDelay: (10*60*1000),
	defaultViewMode: 'file',
	
	initComponent: function() {
		Ext.apply(this, {
			layout: 'fit',
			tbar:[{
				hidden: this._readonlyMode,
				icon: 'images/modules/rsiveo-back-16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},'-',{
				itemId: 'btnFilterDate',
				xtype: 'button',
				textBase: 'Filtre par date',
				menu: [{
					xtype: 'form',
					bodyPadding: 6,
					bodyCls: 'ux-noframe-bg',
					width: 200,
					layout: 'anchor',
					fieldDefaults: {
						anchor: '100%',
						labelWidth: 75
					},
					items: [{
						xtype: 'datefield',
						format: 'Y-m-d',
						name: 'date_start',
						fieldLabel: 'Date début',
						listeners: {
							change: function() {
								this.applyFilterDate() ;
							},
							scope: this
						}
					},{
						xtype: 'datefield',
						format: 'Y-m-d',
						name: 'date_end',
						fieldLabel: 'Date fin',
						listeners: {
							change: function() {
								this.applyFilterDate() ;
							},
							scope: this
						}
					}],
					buttons: [{
						text: 'Appliquer',
						handler: function(btn) {
							var form = btn.up('form') ;
							this.applyFilterDate() ;
						},
						scope: this
					},{
						text: 'Reset',
						handler: function(btn) {
							var form = btn.up('form') ;
							form.reset() ;
							this.applyFilterDate() ;
						},
						scope: this
					}]
				}]
			},'->',{
				iconCls: 'op5-spec-rsiveo-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.doLoad(true) ;
				},
				scope: this
			}],
			items: [{
				region: 'center',
				flex: 1,
				border: false,
				xtype: 'panel',
				itemId: 'pCenter',
				layout: {
					type: 'fit'
				},
				items: []
			}]
		});
		this.callParent() ;
		this.applyFilterDate(true) ;
	},
	applyFilterDate: function(silent) {
		var filterDateForm = this.down('#btnFilterDate').menu.down('form'),
			filterDateValues = filterDateForm.getForm().getFieldValues() ;
		console.dir(filterDateValues) ;
		var filterDateBtn = this.down('#btnFilterDate') ;
		var txt ;
		if( !filterDateValues.date_start && !filterDateValues.date_end ) {
			txt = filterDateBtn.textBase ;
		} else {
			txt = [] ;
			if( filterDateValues.date_start ) {
				txt.push('Du : '+Ext.Date.format(filterDateValues.date_start,'d/m/Y')) ;
			}
			if( filterDateValues.date_end ) {
				txt.push('Au : '+Ext.Date.format(filterDateValues.date_end,'d/m/Y')) ;
			}
			txt = txt.join(' / ') ;
		}
		filterDateBtn.setText(txt) ;
		
		if( filterDateValues.date_start ) {
			this.filters['date_start'] = Ext.Date.format(filterDateValues.date_start,'Y-m-d') ;
		}
		if( filterDateValues.date_end ) {
			this.filters['date_end'] = Ext.Date.format(filterDateValues.date_end,'Y-m-d') ;
		}
		
		if( !silent ) {
			//this.doLoad() ;
		}
	},
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				this.onDataChange() ;
				break ;
			default: break ;
		}
	},
	onDataChange: function() {
		//this.doLoad() 
	},

	
});
