Ext.define('DbsPeopleRhPeopleEventModel', {
	extend: 'Ext.data.Model',
	idProperty: 'event_id',
	fields: [
		{name: 'event_id',   type: 'int'},
		{name: 'event_type',   type: 'string'},
		{name: 'x_code',   type: 'string'},
		{name: 'date_start',   type: 'date'},
		{name: 'date_end',   type: 'date', useNull:true}
	]
});
Ext.define('DbsPeopleRhPeopleModel', {
	extend: 'Ext.data.Model',
	idProperty: 'people_code',
	fields: [
		{name: 'status_out',  type: 'boolean'},
		{name: 'status_undefined',  type: 'boolean'},
		{name: 'status_incident',  type: 'boolean'},
		{name: 'contract_code',  type: 'string'},
		{
			name: 'contract_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.contract_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("CONTRACT",v).text ;
			}
		},
		{name: 'whse_code',  type: 'string'},
		{
			name: 'whse_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.whse_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("WHSE",v).text ;
			}
		},
		{name: 'team_code',  type: 'string'},
		{
			name: 'team_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.team_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("TEAM",v).text ;
			}
		},
		{name: 'role_code',  type: 'string'},
		{
			name: 'role_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.role_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ROLE",v).text ;
			}
		},
		{name: 'people_code',   type: 'string'},
		{name: 'people_name',   type: 'string'},
		{name: 'people_techid',   type: 'string'},
		{name: 'nextEvent_type',   type: 'string'},
		{name: 'nextEvent_dateStart',   type: 'string'},
		{name: 'nextEvent_dateEnd',   type: 'string'},
		{name: 'nextEvent_xCode',   type: 'string'}
	],
	hasMany: [{
		model: 'DbsPeopleRhPeopleEventModel',
		name: 'events',
		associationKey: 'events'
	}]
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
			},'->',{
				icon: 'images/modules/admin-user-16.png',
				text: 'New People',
				handler: function() {
					this.onNewPeople() ;
				},
				scope: this
			}],
			items:[{
				region:'center',
				flex:1,
				border: false,
				xtype:'grid',
				store: {
					model: 'DbsPeopleRhPeopleModel',
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
					groupField: 'whse_code',
					sorters: [{
						property: 'people_name',
						direction: 'ASC'
					}]
				},
				plugins: [{
					ptype: 'bufferedrenderer',
					pluginId: 'bufferedRender'
				}],
				features: [{
					groupHeaderTpl: '{[(values.rows.length > 0 ? values.rows[0].data.whse_txt : "")]}',
					ftype: 'grouping',
					hideGroupedHeader: true
				}],
				columns: [{
					text: 'Entrepôt',
					dataIndex: 'whse_code',
					width: 100,
					renderer: function(v,metaData,record) {
						return record.data.whse_txt ;
					}
				},{
					text: 'Equipe',
					dataIndex: 'team_code',
					width: 100,
					renderer: function(v,metaData,record) {
						return record.data.team_txt ;
					}
				},{
					text: 'Rôle',
					dataIndex: 'role_code',
					width: 100,
					renderer: function(v,metaData,record) {
						return record.data.role_txt ;
					}
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
					//dataIndex: 'nextEvent_txt',
					width: 300
				}],
				listeners: {
					itemclick: function(view,record) {
						this.loadFormRecord(record.getId()) ;
					},
					scope: this
				},
				viewConfig: {
					preserveScrollOnRefresh: true
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
	
	onNewPeople: function() {
		var newPeopleRecord = Ext.ux.dams.ModelManager.create('DbsPeopleRhPeopleModel',{}) ;
		this.setFormRecord(newPeopleRecord) ;
	},
	
	loadFormRecord: function( peopleCode ) {
		this.getEl().mask('Loading record...') ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'RH_getGrid',
				_load_events: 1,
				filter_peopleCode: peopleCode
			},
			callback: function() {
				this.getEl().unmask() ;
			},
			success: function( response ) {
				var json = Ext.JSON.decode(response.responseText),
					peopleRecordData = (json.success ? json.data[0] : null) ;
				if( peopleRecordData ) {
					var peopleRecord = Ext.ux.dams.ModelManager.create('DbsPeopleRhPeopleModel',peopleRecordData);
					this.setFormRecord( peopleRecord ) ;
				}
			},
			scope: this
		});
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
		
		var title ;
		if( peopleRecord.getId() == null ) {
			title = 'Création People' ;
		} else {
			title = 'Modification: '+peopleRecord.get('people_name') ;
		}
		
		eastpanel.removeAll();
		eastpanel.add(Ext.create('Optima5.Modules.Spec.DbsPeople.RhFormPanel',{
			border: false,
			optimaModule: me.optimaModule,
			peopleRecord: peopleRecord,
			listeners: {
				saved: function(rhFormPanel) {
					this.setFormRecord(null);
					this.reload() ;
				},
				scope:me
			}
		}));
		eastpanel._empty = false ;
		eastpanel.setTitle(title) ;
		eastpanel.expand() ;
	},
	
	reload: function() {
		this.down('grid').getStore().load() ;
	},
	
	handleQuit: function() {
		this.destroy() ;
	}
});