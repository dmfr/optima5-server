Ext.define('DbsPeopleRhPanelModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'whse_txt',  type: 'string'},
        {name: 'team_txt',  type: 'string'},
        {name: 'role_txt',  type: 'string'},
        {name: 'people_name',   type: 'string'},
        {name: 'people_techid',   type: 'string'},
        {name: 'nextEvent_txt',   type: 'string'}
     ]
});

Ext.define('Optima5.Modules.Spec.DbsPeople.RhPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsPeople.CfgParamTree',
		'Optima5.Modules.Spec.DbsPeople.RhFormPanel'
	],
	
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
			},'->',{
				icon: 'images/modules/admin-user-16.png',
				text: 'New People',
				handler: Ext.emptyFn
			}],
			items:[{
				region:'center',
				flex:1,
				border: false,
				xtype:'grid',
				store: {
					model: 'DbsPeopleRhPanelModel',
					autoLoad: true,
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_dbs_people',
							_action: 'RH_getGrid'
						},
						reader: {
							type: 'json',
							root: 'data'
						}
					}),
					groupField: 'whse_txt',
					listeners: {
						load: function(store) {
							store.sort('people_name') ;
						}
					}
				},
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
					text: 'Rôle',
					dataIndex: 'role_txt',
					width: 100
				},{
					text: '<b>Nom complet</b>',
					dataIndex: 'people_name',
					width: 200,
					renderer: function(v) {
						return '<b>'+v+'</b>' ;
					}
				},{
					text: 'Tech ID',
					dataIndex: 'people_techid',
					width: 65
				},{
					text: 'Next Event',
					dataIndex: 'nextEvent_txt',
					width: 300
				}],
				listeners: {
					itemclick: function(view,record) {
						this.setFormRecord(record) ;
					},
					scope: this
				}
			},{
				region:'east',
				xtype: 'panel',
				layout:'fit',
				flex: 1,
				itemId:'mRhFormContainer',
				collapsible:true,
				collapsed: true,
				_empty:true,
				listeners:{
					beforeexpand:function(eastpanel) {
						if( eastpanel._empty ) {
							return false;
						}
					},
					scope:me
				}
			}]
		});
		
		this.callParent() ;
	},
	
	setFormRecord: function(peopleRecord) {
		var me = this,
			eastpanel = me.getComponent('mRhFormContainer') ;
		if( peopleRecord == null ) {
			eastpanel._empty = true ;
			eastpanel.collapse() ;
			eastpanel.removeAll() ;
			return ;
		}
		eastpanel.removeAll();
		eastpanel.add(Ext.create('Optima5.Modules.Spec.DbsPeople.RhFormPanel',{
			optimaModule: me.optimaModule,
			devRecord: peopleRecord
		}));
		eastpanel._empty = false ;
		eastpanel.setTitle('Modification: '+peopleRecord.get('people_name')) ;
		eastpanel.expand() ;
	},
	
	handleQuit: function() {
		this.destroy() ;
	}
});