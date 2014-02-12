Ext.define('DbsPeopleForecastModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'time_type',  type: 'string'},
        {name: 'time_txt',  type: 'string'},
		  {name: 'rh_colis', type:'int'},
		  {name: 'rh_pals', type:'int'},
		  {name: 'rh_quai', type:'int'},
		  {name: 'rh_table', type:'int'},
        {name: 'forecast_colis',   type: 'int'},
        {name: 'forecast_pals',   type: 'int'},
		  {name: 'forecast_quai', type:'int'},
		  {name: 'forecast_table', type:'int'},
        {name: 'balance_colis',   type: 'number'},
        {name: 'balance_pals',   type: 'number'},
		  {name: 'balance_quai', type:'number'},
		  {name: 'balance_table', type:'number'}
     ]
});


Ext.define('Optima5.Modules.Spec.DbsPeople.ForecastPanel',{
	extend:'Ext.panel.Panel',
	
	requires:['Optima5.Modules.Spec.DbsPeople.RealAdvancedPanel'],
	
	dateStart: null,
	dateEnd: null,
	
	remoteData: null ,
	cfgData: null,
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			//frame: true,
			border: false,
			layout:'border',
			tbar:[{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<b>Retour menu</b>',
				handler: function(){
					this.handleQuit() ;
				},
				scope: this
			},{
				xtype: 'tbseparator'
			},{
				icon: 'images/op5img/ico_blocs_small.gif',
				text: 'Sites / Entrepôts',
				menu: {
					xtype:'menu',
					items:[Ext.create('Optima5.Modules.Spec.DbsPeople.CfgParamTree',{
						optimaModule: me.optimaModule,
						cfgParam_id: 'whse',
						width:250,
						height:300
					})]
				}
			},{
				icon: 'images/op5img/ico_kuser_16.gif',
				text: 'Equipes',
				menu: {
					xtype:'menu',
					items:[Ext.create('Optima5.Modules.Spec.DbsPeople.CfgParamTree',{
						optimaModule: me.optimaModule,
						cfgParam_id: 'team',
						width:250,
						height:300
					})]
				}
			}],
			items:[{
				region:'center',
				flex:1,
				border: false,
				xtype:'grid',
				plugins: [{
					ptype:'cmprowexpander',
					pluginId: 'rowexpander',
					expandOnDblClick: false,
					expandOnEnter: false,
					createComponent: function(view, record, rowNode, rowIndex) {
						return Ext.create('Optima5.Modules.Spec.DbsPeople.ForecastRowPanel', {
							forceFit: true,
							height: 190,
							rowRecord: record,
							optimaModule: me.optimaModule,
							listeners:{
								datachanged: function() {
									me.reload() ;
								},
								editpromo: function(promoRecord) {
									me.parentBrowserPanel.fireEvent('editpromo',promoRecord) ;
								},
								scope:me
							}
						})
					}
				}],
				store: {
					groupField:'time_type',
					model: 'DbsPeopleForecastModel',
					data:[{
						time_type: 'Journées',
						time_txt: 'Mer. 12/02/2014',
						rh_colis: 29415,
						rh_pals: 5155,
						rh_quai: 4212,
						rh_table: 1300,
						forecast_colis: 29000,
						forecast_pals: 5141,
						forecast_quai: 125,
						forecast_table: 712,
						balance_colis: 1.25,
						balance_pals: -0.75,
						balance_quai: 2.11,
						balance_table: -1.99
					},{
						time_type: 'Journées',
						time_txt: 'Jeu. 13/02/2014',
						rh_colis: 29415,
						rh_pals: 5155,
						rh_quai: 4212,
						rh_table: 1300,
						forecast_colis: 29000,
						forecast_pals: 5141,
						forecast_quai: 125,
						forecast_table: 712,
						balance_colis: 1.25,
						balance_pals: -0.75,
						balance_quai: 2.11,
						balance_table: -1.99
					},{
						time_type: 'Journées',
						time_txt: 'Ven. 14/02/2014',
						rh_colis: 29415,
						rh_pals: 5155,
						rh_quai: 4212,
						rh_table: 1300,
						forecast_colis: 29000,
						forecast_pals: 5141,
						forecast_quai: 125,
						forecast_table: 712,
						balance_colis: 1.25,
						balance_pals: -0.75,
						balance_quai: 2.11,
						balance_table: -1.99
					},{
						time_type: 'Journées',
						time_txt: 'Sam. 15/02/2014',
						rh_colis: 29415,
						rh_pals: 5155,
						rh_quai: 4212,
						rh_table: 1300,
						forecast_colis: 29000,
						forecast_pals: 5141,
						forecast_quai: 125,
						forecast_table: 712,
						balance_colis: 1.25,
						balance_pals: -0.75,
						balance_quai: 2.11,
						balance_table: -1.99
					},{
						time_type: 'Semaines',
						time_txt: 'sem 08-2014',
						rh_colis: 29415,
						rh_pals: 5155,
						rh_quai: 4212,
						rh_table: 1300,
						forecast_colis: 29000,
						forecast_pals: 5141,
						forecast_quai: 125,
						forecast_table: 712,
						balance_colis: 1.25,
						balance_pals: -0.75,
						balance_quai: 2.11,
						balance_table: -1.99
					},{
						time_type: 'Semaines',
						time_txt: 'sem 09-2014',
						rh_colis: 29415,
						rh_pals: 5155,
						rh_quai: 4212,
						rh_table: 1300,
						forecast_colis: 29000,
						forecast_pals: 5141,
						forecast_quai: 125,
						forecast_table: 712,
						balance_colis: 1.25,
						balance_pals: -0.75,
						balance_quai: 2.11,
						balance_table: -1.99
					},{
						time_type: 'Semaines',
						time_txt: 'sem 10-2014',
						rh_colis: 29415,
						rh_pals: 5155,
						rh_quai: 4212,
						rh_table: 1300,
						forecast_colis: 29000,
						forecast_pals: 5141,
						forecast_quai: 125,
						forecast_table: 712,
						balance_colis: 1.25,
						balance_pals: -0.75,
						balance_quai: 2.11,
						balance_table: -1.99
					},{
						time_type: 'Semaines',
						time_txt: 'sem 11-2014',
						rh_colis: 29415,
						rh_pals: 5155,
						rh_quai: 4212,
						rh_table: 1300,
						forecast_colis: 29000,
						forecast_pals: 5141,
						forecast_quai: 125,
						forecast_table: 712,
						balance_colis: 1.25,
						balance_pals: -0.75,
						balance_quai: 2.11,
						balance_table: -1.99
					}]
				},
				//plugins: [cellEditing],
				features: [{
					groupHeaderTpl: '{name}',
					ftype: 'groupingsummary',
					hideGroupedHeader: true
				}],
				columns: [{
					text: 'Type',
					dataIndex: 'time_type',
				},{
					text: 'Période',
					dataIndex: 'time_txt',
					width: 120,
				},{
					text: 'Capacité',
					defaults: {
						width: 60
					},
					columns: [{
						text: 'Colis',
						dataIndex: 'rh_colis',
					},{
						text: 'Pals I/O',
						dataIndex: 'rh_pals',
					},{
						text: 'Quai',
						dataIndex: 'rh_quai',
					},{
						text: 'Table',
						dataIndex: 'rh_table',
					}]
				},{
					text: 'Forecast',
					defaults: {
						width: 60
					},
					columns: [{
						text: 'Colis',
						dataIndex: 'forecast_colis',
					},{
						text: 'Pals I/O',
						dataIndex: 'forecast_pals',
					},{
						text: 'Camions',
						dataIndex: 'forecast_quai',
					},{
						text: 'Table',
						dataIndex: 'forecast_table',
					}]
				},{
					text: '<b>Besoins / Excédent</b>',
					defaults: {
						width: 60,
						renderer: function(value,meta) {
							if( value > 0 ) {
								meta.tdCls = 'op5-spec-dbspeople-balance-pos' ;
								return '<b>+ '+Math.abs(value) + '</b>' ;
							} else if( value < 0 ) {
								meta.tdCls = 'op5-spec-dbspeople-balance-neg' ;
								return '<b>- '+Math.abs(value) + '</b>' ;
							} else if( value==='' ) {
								return '' ;
							} else {
								return '=' ;
							}
						}
					},
					columns: [{
						text: 'Prep',
						dataIndex: 'balance_colis',
					},{
						text: 'Cariste',
						dataIndex: 'balance_pals',
					},{
						text: 'AgentQ',
						dataIndex: 'balance_quai',
					},{
						text: 'Table',
						dataIndex: 'balance_table',
					}]
				}]
			}]
		});
		
		this.callParent() ;
	},
	handleQuit: function() {
		this.destroy() ;
	}
	
});