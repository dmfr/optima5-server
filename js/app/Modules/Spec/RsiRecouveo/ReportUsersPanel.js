Ext.define('RsiRecouveoReportUserModel',{
	extend: 'Ext.data.Model',
	idProperty: 'user_id',
	fields: [
		{ name: 'user_id', type: 'string' },
		{ name: 'user_fullname', type: 'string' },
		{ name: 'com_callout', type: 'int' },
		{ name: 'com_mailout', type: 'int' },
		{ name: 'res_PAY', type: 'number' },
		{ name: 'res_AVR', type: 'number' },
		{ name: 'res_misc', type: 'number' },
		{ name: 'delay_pay', type: 'int' },
		{ name: 'delay_open', type: 'int' },
		{ name: 'delay_litig', type: 'int' },
		{ name: 'inv_balage', type: 'auto' }
	]
});

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
		this.tmpModelCnt = 0 ;
		
		this.buildViews() ;
		this.doLoad() ;
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
		} else {
			this.filters['date_start'] = null ;
		}
		if( filterDateValues.date_end ) {
			this.filters['date_end'] = Ext.Date.format(filterDateValues.date_end,'Y-m-d') ;
		} else {
			this.filters['date_end'] = null ;
		}
		
		if( !silent ) {
			this.doLoad() ;
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
		this.doLoad() 
	},

	buildViews: function() {
		var balageFields = [], balageColumns = [] ;
		var balageRenderer = function(value,metaData,record) {
			if( value == 0 ) {
				return '&#160;' ;
			}
			return Ext.util.Format.number(value,'0,000.00') ;
		};
		var balageConvert = function(value,record) {
			var thisField = this,
				balageSegmtId = thisField.balageSegmtId ;
			return record.data.inv_balage[balageSegmtId] ;
		};
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getBalageAll(), function(balageSegmt) {
			var balageField = 'inv_balage_'+balageSegmt.segmt_id ;
			balageColumns.push({
				text: balageSegmt.segmt_txt,
				dataIndex: balageField,
				width:90,
				align: 'center',
				renderer: balageRenderer
			}) ;
			
			balageFields.push({
				name: balageField,
				balageSegmtId: balageSegmt.segmt_id,
				type: 'number',
				convert: balageConvert
			});
		}) ;
		
		var amountRenderer = function(v) {
			if( v != 0 ) {
				return '<b>'+Ext.util.Format.number(v,'0,000.00')+'</b>'+'&#160;'+'€' ;
			}
		}
		var countRenderer = function(v) {
			if( v != 0 ) {
				return '<b>'+v+'</b>' ;
			}
		}
		
		var pCenter = this.down('#pCenter') ;
		
		var columns = [{
			text: 'Collaborateur',
			width:100,
			dataIndex: 'user_fullname'
		},{
			tdCls: 'op5-spec-rsiveo-alm',
			text: 'Actions réalisées',
			columns: [{
				tdCls: 'op5-spec-rsiveo-alm',
				text: 'Appels',
				dataIndex: 'com_callout',
				width:100,
				align: 'center',
				renderer: countRenderer
			},{
				tdCls: 'op5-spec-rsiveo-alm',
				text: 'Courriers man.',
				dataIndex: 'com_mailout',
				width:100,
				align: 'center',
				renderer: countRenderer
			}]
		},{
			tdCls: 'op5-spec-rsiveo-pis',
			text: 'Résolution',
			columns: [{
				tdCls: 'op5-spec-rsiveo-pis',
				text: 'Paiements',
				dataIndex: 'res_PAY',
				width:120,
				align: 'center',
				renderer: amountRenderer
			},{
				tdCls: 'op5-spec-rsiveo-pis',
				text: 'Avoirs',
				dataIndex: 'res_AVR',
				width:120,
				align: 'center',
				renderer: amountRenderer
			},{
				tdCls: 'op5-spec-rsiveo-pis',
				text: 'Autres',
				dataIndex: 'res_misc',
				width:120,
				align: 'center',
				renderer: amountRenderer
			}]
		},{
			tdCls: 'op5-spec-rsiveo-pom',
			text: 'Actions en retard au ' + Ext.Date.format(new Date(),'d/m/Y'),
			columns: [{
				tdCls: 'op5-spec-rsiveo-pom',
				text: 'Paiements',
				dataIndex: 'delay_pay',
				width:100,
				align: 'center',
				renderer: countRenderer
			},{
				tdCls: 'op5-spec-rsiveo-pom',
				text: 'En-cours',
				dataIndex: 'delay_open',
				width:100,
				align: 'center',
				renderer: countRenderer
			},{
				tdCls: 'op5-spec-rsiveo-pom',
				text: 'Actions<br>externes',
				dataIndex: 'delay_litig',
				width:100,
				align: 'center',
				renderer: countRenderer
			}]
		},{
			text: 'Balance âgée',
			columns: balageColumns
		}] ;
		
		columns = {
			defaults: {
				menuDisabled: false,
				draggable: false,
				sortable: true,
				hideable: false,
				resizable: true,
				groupable: false,
				lockable: false
			},
			items: columns
		}
		
		this.tmpModelName = 'RsiRecouveoReportUserModel'+'-' + this.getId() + (++this.tmpModelCnt) ;
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: 'RsiRecouveoReportUserModel',
			idProperty: 'user_id',
			fields: balageFields
		});
		
		pCenter.removeAll() ;
		pCenter.add({
			xtype: 'grid',
			itemId: 'pGrid',
			columns: columns,
			store: {
				model: this.tmpModelName,
				data: [],
				proxy: {
					type: 'memory'
				}
			}
		});
	},
	
	doLoad: function(doClearFilters) {
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'report_getUsers',
				filters: Ext.JSON.encode(this.filters)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoad(ajaxResponse.data, doClearFilters) ;
				// Setup autoRefresh task
				//this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoad: function(ajaxData, doClearFilters) {
		// grid 
		if( doClearFilters ) {
			this.down('#pCenter').down('#pGrid').getStore().clearFilter() ;
			this.down('#pCenter').down('#pGrid').getStore().sort('next_date','ASC') ;
		}
		this.down('#pCenter').down('#pGrid').getStore().loadRawData(ajaxData) ;
	},
	
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	}
	
});
