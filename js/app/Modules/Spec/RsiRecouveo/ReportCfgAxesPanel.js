Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportCfgAxesPanel',{
	extend: 'Ext.form.Panel',
	
	initComponent: function() {
		Ext.apply(this,{
			layout: 'anchor',
			fieldDefaults: {
				anchor: '100%',
				labelWidth: 90
			},
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 8,
			items: [{
				xtype: 'fieldset',
				title: 'Période',
				items: [{
					xtype: 'combobox',
					name: 'group_date_type',
					fieldLabel: 'Intervalle',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['mode','lib'],
						data : [
							{mode:'DAY', lib:'Day (Y-m-d)'},
							{mode:'WEEK', lib:'Week (Y-week)'},
							{mode:'MONTH', lib:'Month (Y-m)'},
							{mode:'YEAR', lib:'Year (Y)'}
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'mode'
				},{
					xtype: 'datefield',
					fieldLabel: 'Date début',
					format: 'Y-m-d'
				},{
					xtype: 'datefield',
					fieldLabel: 'Date fin',
					format: 'Y-m-d'
				}]
			},{
				xtype: 'fieldset',
				title: 'Périmètre',
				items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
					itemId: 'btnSoc',
					cfgParam_id: 'SOC',
					cfgParam_emptyDisplayText: 'Toutes',
					icon: 'images/modules/rsiveo-blocs-16.gif',
					selectMode: 'MULTI',
					fieldLabel: 'Entité(s)',
					optimaModule: this.optimaModule,
					listeners: {
						change: {
							fn: function() {
								this.onSocSet() ;
							},
							scope: this
						},
						ready: {
							fn: function() {
								
							},
							scope: this
						}
					}
				}),{
					itemId: 'cntAtr',
					xtype: 'fieldcontainer',
					layout: 'anchor',
					border: false,
					items: []
				}]
			}]
		}) ;
		this.callParent() ;
		this.initFields() ;
		this.on('afterrender',function() {
			//this.onAfterRender() ;
		}) ;
		if( this._reportCfgRecord ) {
			this.setReportCfgRecordt( this._reportCfgRecord ) ;
		}
	},
	initFields: function() {
		var cntAtr = this.down('#cntAtr') ;
		cntAtr.removeAll() ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			if( !atrRecord.is_filter ) {
				return ;
			}
			cntAtr.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamField',{
				cfgParam_id: 'ATR:'+atrRecord.atr_id,
				cfgParam_atrType: atrRecord.atr_type,
				cfgParam_emptyDisplayText: 'Toutes valeurs',
				fieldLabel: atrRecord.atr_desc,
				labelAlign: 'top',
				icon: 'images/modules/rsiveo-blocs-16.gif',
				selectMode: 'MULTI',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.onAtrSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							
						},
						scope: this
					}
				}
			}) );
		},this) ;
	},
	onSocSet: function() {
		this.configureFields() ;
	},
	configureFields: function() {
		var btnSoc = this.down('#btnSoc'),
			tbSocsSelected = btnSoc.getLeafNodesKey() ;
		var cfgParamIds = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(tbSocsSelected), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			cfgParamIds.push( 'ATR:'+atrRecord.atr_id ) ;
		}) ;
		console.dir(cfgParamIds) ;
	},
	
	setReportCfgRecord: function( reportCfgRecord ) {
		
	},
	
	doFireEventCfg: function() {
		this.fireEvent('cfgset',this,this.getReportCfg) ;
	},
	getReportCfg: function() {
		// return JS obj
		
	}
}) ;
