Ext.define('DbsPeopleRhPeopleEventModel', {
	extend: 'Ext.data.Model',
	idProperty: 'event_id',
	fields: [
		{name: 'event_id',   type: 'int'},
		{name: 'event_type',   type: 'string'},
		{name: 'x_code',   type: 'string'},
		{name: 'date_start',   type: 'date', dateFormat:'Y-m-d'},
		{name: 'date_end',   type: 'date', dateFormat:'Y-m-d', useNull:true}
	]
});

Ext.define('DbsPeopleRhPeopleCalcAttributeRowModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'row_date', type: 'string'},
		{name: 'row_text', type: 'string'},
		{name: 'row_value', type: 'number'}
	]
}) ;
Ext.define('DbsPeopleRhPeopleCalcAttributeModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'people_calc_attribute',   type: 'string'},
		{name: 'calc_date',   type: 'string'},
		{name: 'calc_value',   type: 'number'},
		{name: 'calc_unit_txt',   type: 'string'}
	],
	hasMany: [{
		model: 'DbsPeopleRhPeopleCalcAttributeRowModel',
		name: 'rows',
		associationKey: 'rows'
	}]
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
		{name: 'people_txtitm',   type: 'string'},
		{name: 'nextEvent_type',   type: 'string'},
		{name: 'nextEvent_dateStart',   type: 'string'},
		{name: 'nextEvent_dateEnd',   type: 'string'},
		{name: 'nextEvent_xCode',   type: 'string'}
	],
	hasMany: [{
		model: 'DbsPeopleRhPeopleEventModel',
		name: 'events',
		associationKey: 'events'
	},{
		model: 'DbsPeopleRhPeopleCalcAttributeModel',
		name: 'calc_attributes',
		associationKey: 'calc_attributes'
	}]
});

Ext.define('Optima5.Modules.Spec.DbsPeople.RhPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Spec.DbsPeople.CfgParamTree',
		'Optima5.Modules.Spec.DbsPeople.RhFormPanel',
		'Optima5.Modules.Spec.DbsPeople.RhCalcAttributesPanel'
	],
	
	cfgPeopleCalcAttributes: [],
	
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
			},Ext.create('Optima5.Modules.Spec.DbsPeople.CfgParamSiteButton',{
				itemId: 'btnSite',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.reload() ;
						},
						scope: this
					}
				}
			}),'->',{
				icon: 'images/modules/admin-user-16.png',
				text: 'New People',
				handler: function() {
					this.onNewPeople() ;
				},
				scope: this
			}],
			items:[{
				region:'center',
				itemId:'mRhGridContainer',
				flex:1,
				border: false,
				layout: 'fit',
				items:[{
					xtype: 'component',
					cls: 'op5-waiting'
				}]
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
		
		this.tmpModelName = 'DbsPeopleRhPeopleModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpModelName ) ;
		}) ;
		
		this.callParent() ;
		this.startPanel() ;
	},
	
	
	startPanel: function() {
		var me = this ;
		me.cfgToLoad = 1 ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_people',
				_action: 'cfg_getPeopleCalcAttributes'
			},
			callback: function() {
				this.onConfigureLoad() ;
			},
			success: function( response ) {
				var json = Ext.JSON.decode(response.responseText),
					cfgPeopleCalcAttributes = (json.success ? json.data : []) ;
				this.cfgPeopleCalcAttributes = cfgPeopleCalcAttributes ;
			},
			scope: this
		});
	},
	onConfigureLoad: function() {
		var me = this ;
		me.cfgToLoad-- ;
		if( me.cfgToLoad == 0 ) {
			me.isReady=true ;
			me.doGridConfigure() ;
		}
	},
	doGridConfigure: function() {
		var me = this,
			gridCnt = me.down('#mRhGridContainer') ;
			
		//console.dir(grid.columns) ;
		var columns = [{
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
			text: 'Contrat',
			dataIndex: 'contract_code',
			width: 100,
			renderer: function(v,metaData,record) {
				return record.data.contract_txt ;
			},
			hideable: true,
			hidden: true
		},{
			text: 'Interim',
			dataIndex: 'people_txtitm',
			width: 100,
			hideable: true,
			hidden: true
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
			hidden: true,
			//dataIndex: 'nextEvent_txt',
			width: 300
		}] ;
		
		var calcAttributeRenderer = function(v,metaData) {
			if( v < 0 ) {
				metaData.tdCls += ' op5-spec-dbspeople-balance-neg' ;
			} else if( v > 0 ) {
				metaData.tdCls += ' op5-spec-dbspeople-balance-pos' ;
			}
			if( v != 0 ) {
				metaData.tdCls += ' op5-spec-dbspeople-balance-big' ;
			}
			return v ;
		} ;
		
		var addFields = [] ;
		var peopleCalcColumns = [] ;
		Ext.Array.each(this.cfgPeopleCalcAttributes, function(peopleCalcAttr) {
			peopleCalcColumns.push({
				_peopleCalcAttribute: peopleCalcAttr.peopleCalcAttribute,
				width: 75,
				align: 'center',
				text: peopleCalcAttr.text,
				dataIndex: 'calc_' + peopleCalcAttr.peopleCalcAttribute,
				renderer: calcAttributeRenderer
			});
			addFields.push({
				_peopleCalcAttribute: peopleCalcAttr.peopleCalcAttribute,
				name: 'calc_' + peopleCalcAttr.peopleCalcAttribute,
				type: 'number',
				useNull: true
			});
		}) ;
		if( !Ext.isEmpty(peopleCalcColumns) ) {
			columns.push({
				text: 'People Calc Attributes',
				columns: peopleCalcColumns
			}) ;
		}
		
		Ext.define(this.tmpModelName,{
			extend: 'DbsPeopleRhPeopleModel',
			fields: addFields
		});
		
		var columnDefaults = {
			menuDisabled: false,
			draggable: false,
			sortable: false,
			hideable: false,
			resizable: false,
			groupable: false,
			lockable: false
		} ;
		Ext.Array.each( columns, function(column) {
			Ext.applyIf( column, columnDefaults ) ;
			if( !Ext.isEmpty(column['_groupBy']) ) {
				// false groupable to enable columnMenu
				column['groupable'] = true ;
			}
		}) ;
		
		var gridCfg = {
			xtype:'grid',
			border: false,
			store: {
				model: this.tmpModelName,
				autoLoad: true,
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_dbs_people',
						_action: 'RH_getGrid',
						_load_calcAttributes: 1
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
				}],
				listeners: {
					beforeload: me.onBeforeLoad,
					load: me.onLoad,
					scope: me
				}
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
			columns: columns,
			listeners: {
				itemclick: this.onItemClick,
				scope: this
			},
			viewConfig: {
				preserveScrollOnRefresh: true
			}
		} ;
		
		gridCnt.removeCls('op5-waiting') ;
		gridCnt.removeAll() ;
		gridCnt.add( gridCfg ) ;
	},
	reload: function() {
		if( !this.isReady ) {
			return ;
		}
		this.down('grid').getStore().load() ;
	},
	onBeforeLoad: function(store,options) {
		var filterSiteBtn = this.down('#btnSite') ;
		
		options.params = options.params || {};
		var addParams = {} ;
		if( filterSiteBtn.getNode() != null ) {
			addParams['filter_site_entries'] = Ext.JSON.encode( filterSiteBtn.getLeafNodesKey() ) ;
		}
		Ext.apply(options.params, addParams);
	},
	onLoad: function(store) {
		var map_peopleCalcAttribute_fieldName = {}
		Ext.Array.each( store.model.getFields(), function(field) {
			if( field._peopleCalcAttribute != null ) {
				map_peopleCalcAttribute_fieldName[field._peopleCalcAttribute] = field.name ;
			}
		}) ;
		
		// Restore calc attributes
		store.suspendEvents();
		store.each( function(record) {
			//console.dir(record) ;
			var peopleCalcAttribute, fieldName ;
			for( peopleCalcAttribute in map_peopleCalcAttribute_fieldName ) {
				fieldName = map_peopleCalcAttribute_fieldName[peopleCalcAttribute] ;
				peopleCalcRecord = record.calc_attributes().findRecord('people_calc_attribute',peopleCalcAttribute) ;
				
				if( peopleCalcRecord == null ) {
					continue ;
				}
				record.set(fieldName,peopleCalcRecord.get('calc_value')) ;
			}
			record.commit() ;
		});
		store.resumeEvents() ;
		this.down('grid').getView().refresh() ;
	},
	
	
	onNewPeople: function() {
		var newPeopleRecord = Ext.ux.dams.ModelManager.create('DbsPeopleRhPeopleModel',{}) ;
		this.setFormRecord(newPeopleRecord) ;
	},
	onItemClick: function( view, record, itemNode, index, e ) {
		var cellNode = e.getTarget( view.getCellSelector() ),
			cellColumn = view.getHeaderByCell( cellNode ) ;
		if( !Ext.isEmpty(cellColumn._peopleCalcAttribute) ) {
			this.setCalcDetails( record ) ;
			return ;
		}
		
		this.loadFormRecord(record.getId()) ;
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
	
	setCalcDetails: function( peopleRecord ) {
		var me = this,
			eastpanel = me.getComponent('mRhFormContainer') ;
		if( peopleRecord == null ) {
			eastpanel._empty = true ;
			eastpanel.collapse() ;
			eastpanel.removeAll() ;
			return ;
		}
		
		var title = 'Compteurs' ;
		
		eastpanel.removeAll();
		eastpanel.add(Ext.create('Optima5.Modules.Spec.DbsPeople.RhCalcAttributesPanel',{
			border: false,
			optimaModule: me.optimaModule,
			cfgPeopleCalcAttributes: me.cfgPeopleCalcAttributes,
			peopleRecord: peopleRecord
		}));
		eastpanel._empty = false ;
		eastpanel.setTitle(title) ;
		eastpanel.expand() ;
	},
	
	handleQuit: function() {
		var eastpanel = this.getComponent('mRhFormContainer'),
			eastpanelItem = eastpanel.items.getAt(0) ;
		if( eastpanel.collapsed || Ext.getClassName(eastpanelItem) != 'Optima5.Modules.Spec.DbsPeople.RhFormPanel' ) {
			this.doQuit() ;
			return ;
		}
		Ext.MessageBox.confirm('Confirmation','Edition profil people non terminée. Quitter ?', function(buttonStr) {
			if( buttonStr!='yes' ) {
				return ;
			}
			this.doQuit() ;
		}, this);
	},
	doQuit: function() {
		this.destroy() ;
	}
});