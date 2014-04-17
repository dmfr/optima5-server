Ext.define('DbsPeopleRhPeopleModel', {
	extend: 'Ext.data.Model',
	idProperty: 'people_code',
	fields: [
		{name: 'people_id', type:'string'},
		{name: 'status_out',  type: 'boolean'},
		{name: 'status_undefined',  type: 'boolean'},
		{name: 'status_incident',  type: 'boolean'},
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
						this.setFormRecord(record) ;
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
			peopleRecord: peopleRecord,
			listeners: {
				change: function(rhFormPanel) {
					var peopleCode = rhFormPanel.peopleCode ;
					this.reload( peopleCode ) ;
				},
				scope:me
			}
		}));
		eastpanel._empty = false ;
		eastpanel.setTitle('Modification: '+peopleRecord.get('people_name')) ;
		eastpanel.expand() ;
	},
	
	reload: function( peopleCode ) {
		if( !Ext.isEmpty(peopleCode) ) {
			this.optimaModule.getConfiguredAjaxConnection().request({
				params: {
					_moduleId: 'spec_dbs_people',
					_action: 'RH_getGrid',
					filter_peopleCode: peopleCode
				},
				success: function( response ) {
					var ajaxData = Ext.JSON.decode(response.responseText).data,
						peopleRecordData = ajaxData[0] ;
					this.replaceRecord( peopleRecordData.people_code, peopleRecordData ) ;
				},
				scope: this
			});
			return ;
		}
		this.down('grid').getStore().load() ;
	},
	replaceRecord: function( peopleCode, peopleRecordData ) {
		var store = this.down('grid').getStore(),
			record = store.getById(peopleCode),
			newRecord = Ext.create('DbsPeopleRhPeopleModel',peopleRecordData) ;
		if( record != null ) {
			record.set(newRecord.data) ;
			record.commit() ;
		}
		
		var eastpanel = this.getComponent('mRhFormContainer'),
			eastpanelForm = eastpanel.down('panel') ;
		if( eastpanelForm != null && eastpanelForm.peopleCode == peopleCode ) {
			eastpanelForm.setPeopleRecord( newRecord ) ;
		}
	},
	
	handleQuit: function() {
		this.destroy() ;
	}
});