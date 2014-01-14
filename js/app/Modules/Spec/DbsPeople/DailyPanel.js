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
					model: 'DbsPeopleRhRealModel',
					data:[]
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
					header: 'Lundi 06/01',
					headers: [{
						header: 'Role',
						dataIndex: 'lundi_role'
						width:150
					},{
						header: 'Tmp',
						dataIndex: 'lundi_type',
						width:50
					}]
				}],
				listeners: {
					itemclick: function(view,record) {
						this.setFormRecord(record) ;
					},
					scope: this
				}
			}]
		});
		
		this.callParent() ;
	},
	
	handleQuit: function() {
		this.destroy() ;
	}
});