Ext.define('DbsPeopleRhRealModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'whse_txt',  type: 'string'},
        {name: 'team_txt',  type: 'string'},
        {name: 'people_name',   type: 'string'},
        {name: 'people_techid',   type: 'string'},
		  {name: 'lundi_role', type:'string'},
		  {name: 'lundi_time', type:'int'},
		  {name: 'mardi_role', type:'string'},
		  {name: 'mardi_time', type:'int'},
		  {name: 'mercredi_role', type:'string'},
		  {name: 'mercredi_time', type:'int'},
		  {name: 'jeudi_role', type:'string'},
		  {name: 'jeudi_time', type:'int'},
		  {name: 'vendredi_role', type:'string'},
		  {name: 'vendredi_time', type:'int'},
     ]
});

Ext.define('Optima5.Modules.Spec.DbsPeople.RealPanel',{
	extend:'Ext.panel.Panel',
	
	initComponent: function() {
		var me = this ;
		
		var cellEditing = Ext.create('Ext.grid.plugin.CellEditing', {
			clicksToEdit: 1
		});
		
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
			},'->',{
				icon: 'images/op5img/ico_calendar_16.png',
				text: 'Choix Semaine',
				menu: Ext.create('Ext.menu.DatePicker')
			}],
			items:[{
				region:'center',
				flex:1,
				border: false,
				xtype:'grid',
				store: {
					model: 'DbsPeopleRhRealModel',
					data:[]
				},
				plugins: [cellEditing],
				features: [{
					groupHeaderTpl: '{name}',
					ftype: 'groupingsummary',
					hideGroupedHeader: true
				}],
				columns: [{
					text: 'Entrepôt',
					dataIndex: 'whse_txt',
					width: 180
				},{
					text: 'Equipe',
					dataIndex: 'team_txt',
					width: 100
				},{
					text: '<b>Nom complet</b>',
					dataIndex: 'people_name',
					width: 200,
					renderer: function(v) {
						return '<b>'+v+'</b>' ;
					}
				},{
					text: 'Lundi 06/01',
					columns: [{
						text: 'Role',
						dataIndex: 'lundi_role',
						width:100,
						editor: {
							ROLE: true,
							xtype: 'combobox',
							queryMode: 'local',
							forceSelection: true,
							editable: false,
							displayField: 'text',
							valueField: 'id',
							store: {
								fields: ['id','text'],
								data : []
							},
							matchFieldWidth: false
						}
					},{
						text: 'Tmp',
						dataIndex: 'lundi_time',
						width:50,
						editor: {xtype: 'numberfield' }
					}]
				},{
					text: 'Mardi 07/01',
					columns: [{
						text: 'Role',
						dataIndex: 'mardi_role',
						width:100,
						editor: {
							ROLE: true,
							xtype: 'combobox',
							queryMode: 'local',
							forceSelection: true,
							editable: false,
							displayField: 'text',
							valueField: 'id',
							store: {
								fields: ['id','text'],
								data : []
							},
							matchFieldWidth: false
						}
					},{
						text: 'Tmp',
						dataIndex: 'mardi_time',
						width:50,
						editor: {xtype: 'numberfield' }
					}]
				},{
					text: 'Mercredi 08/01',
					columns: [{
						text: 'Role',
						dataIndex: 'mercredi_role',
						width:100,
						editor: {
							ROLE: true,
							xtype: 'combobox',
							queryMode: 'local',
							forceSelection: true,
							editable: false,
							displayField: 'text',
							valueField: 'id',
							store: {
								fields: ['id','text'],
								data : []
							},
							matchFieldWidth: false
						}
					},{
						text: 'Tmp',
						dataIndex: 'mercredi_time',
						width:50,
						editor: {xtype: 'numberfield' }
					}]
				},{
					text: 'Jeudi 09/01',
					columns: [{
						text: 'Role',
						dataIndex: 'jeudi_role',
						width:100,
						editor: {
							ROLE: true,
							xtype: 'combobox',
							queryMode: 'local',
							forceSelection: true,
							editable: false,
							displayField: 'text',
							valueField: 'id',
							store: {
								fields: ['id','text'],
								data : []
							},
							matchFieldWidth: false
						}
					},{
						text: 'Tmp',
						dataIndex: 'jeudi_time',
						width:50,
						editor: {xtype: 'numberfield' }
					}]
				},{
					text: 'Vendredi 10/01',
					columns: [{
						text: 'Role',
						dataIndex: 'vendredi_role',
						width:100,
						editor: {
							ROLE: true,
							xtype: 'combobox',
							queryMode: 'local',
							forceSelection: true,
							editable: false,
							displayField: 'text',
							valueField: 'id',
							store: {
								fields: ['id','text'],
								data : []
							},
							matchFieldWidth: false
						}
					},{
						text: 'Tmp',
						dataIndex: 'vendredi_time',
						width:50,
						editor: {xtype: 'numberfield' }
					}]
				}]
			}]
		});
		
		this.callParent() ;
		this.startLoading() ;
	},
	startLoading: function() {
		var me = this ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'RH_getCfgData',
				cfgParam_id: this.cfgParam_id
			},
			success: function(response) {
				var jsonResponse = Ext.decode(response.responseText) ;
				if( jsonResponse.success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.child('grid').getView().headerCt.items.each( function(colm) {
						colm.items.each( function(col) {
							if( col.getEditor() && col.getEditor().ROLE ) {
								col.getEditor().getStore().loadData(jsonResponse.data.ROLE) ;
							}
						},me); 
					},me);
					this.devCfgData = jsonResponse.data ;
				}
			},
			scope: this
		});
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'RH_getGrid'
			},
			success: function(response) {
				var jsonResponse = Ext.decode(response.responseText) ;
				if( jsonResponse.success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					var srcData = jsonResponse.data
					var dstData = [] ;
					for( var i=0 ; i<srcData.length ; i++ ) {
						var srcRow=srcData[i] ;
						dstData.push({
							whse_txt: srcRow.whse_txt,
							team_txt: srcRow.team_txt,
							people_name: srcRow.people_name,
							lundi_role: 'PRE',
							lundi_time: 7,
							mardi_role: 'PRE',
							mardi_time: 7,
							mercredi_role: 'PRE',
							mercredi_time: 7,
							jeudi_role: 'PRE',
							jeudi_time: 7,
							vendredi_role: 'PRE',
							vendredi_time: 7
						});
					}
					me.child('grid').getStore().loadData(dstData) ;
					me.child('grid').getStore().sort('people_name') ;
				}
			},
			scope: this
		});
	},
	
	handleQuit: function() {
		this.destroy() ;
	}
});