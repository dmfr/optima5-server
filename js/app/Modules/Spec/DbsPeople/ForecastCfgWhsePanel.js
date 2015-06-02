Ext.define('DbsPeopleForecastCfgWhseTreeModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'node_type', type:'string'},
		{name: 'whse_code', type:'string'},
		{
			name: 'whse_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.whse_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("WHSE",v).text ;
			}
		},
		{name: 'uo_code', type:'string'},
		{
			name: 'uo_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.uo_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("UO",v).text ;
			}
		},
		{name: 'role_code', type:'string'},
		{
			name: 'role_txt',
			type: 'string',
			convert: function(v, record) {
				v = record.data.role_code ;
				return Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetById("ROLE",v).text ;
			}
		},
		{name: 'role_hRate', type:'int', useNull:true},
		
		{name: 'staticText', type:'string'},
		{
			name: 'text',
			type:'string',
			convert: function(v,record) {
				switch( record.get('node_type') ) {
					case 'UO' :
						return record.get('uo_txt') ;
						
					case 'ROLE' :
						return record.get('role_txt') ;
						
					case 'WHSE' :
						return '<b>' + record.get('whse_txt') + '</b>' ;
						
					default :
						return '<b>' + record.get('staticText') + '</b>' ;
				}
			}
		}
	]
}) ;

Ext.define('Optima5.Modules.Spec.DbsPeople.ForecastCfgWhsePanel',{
	extend:'Ext.panel.Panel',
	
	whseCode: null,
	optimaModule: null,
	
	initComponent: function() {
		Ext.apply(this,{
			title: 'Définition UO / Prods',
			layout: { 
				type: 'hbox',
				align: 'stretch'
			},
			items:[{
				frame: true,
				border: 10,
				flex: 1,
				itemId: 'tpSource',
				xtype: 'treepanel',
				title: 'Source : Unités d\'oeuvre / Roles',
				headerPosition: 'right',
				useArrows: true,
				rootVisible: false,
				hideHeaders: true,
				columns: [{
					xtype: 'treecolumn',
					dataIndex: 'text',
					flex: 1
				}],
				store: {
					model: 'DbsPeopleForecastCfgWhseTreeModel',
					root: {children:[]},
					proxy: {
						type: 'memory' ,
						reader: {
							type: 'json'
						}
					}
				},
				viewConfig: {
					plugins: {
						ptype: 'treeviewdragdrop',
						enableDrag: true,
						enableDrop: false,
						ddGroup: 'DD-'+this.getId()
					}
				}
			},{
				flex: 2,
				itemId: 'tpDefinition',
				xtype: 'treepanel',
				store: {
					model: 'DbsPeopleForecastCfgWhseTreeModel',
					root: {children:[]},
					proxy: {
						type: 'memory' ,
						reader: {
							type: 'json'
						}
					}
				},
				columns: [{
					xtype: 'treecolumn',
					width: 250,
					text: 'UO > Roles',
					dataIndex: 'text'
				},{
					width: 80,
					align: 'center',
					text: 'Prod ( ut / H )',
					dataIndex: 'role_hRate',
					renderer: function(v,metaData) {
						if( v === 0 ) {
							metaData.style += ' ; color:red;' ;
						}
						metaData.style += ' ; font-weight:bold;' ;
						return v ;
					},
					editor: { xtype:'numberfield' }
				}],
				listeners: {
					itemcontextmenu: function(view, record, item, index, event) {
						if( record.isRoot() ) {
							return ;
						}
						var gridContextMenu = Ext.create('Ext.menu.Menu',{
							items : [{
								iconCls: 'icon-bible-delete',
								text: 'Supprimer',
								record: record,
								handler : function(menuitem) {
									menuitem.record.remove();
								}
							}],
							listeners: {
								hide: function(menu) {
									Ext.defer(function(){menu.destroy();},10) ;
								}
							}
						}) ;
						gridContextMenu.showAt(event.getXY());
					}
				},
				viewConfig: {
					listeners:{
						render: this.initComponentOnDefinitionRender,
						scope: this
					}
				},
				plugins: [Ext.create('Ext.grid.plugin.CellEditing', {
					clicksToEdit: 1,
					listeners: {
						beforeedit: function( editor, editEvent ) {
							var record = editEvent.record ;
							if( record.get('node_type') != 'ROLE' ) {
								return false ;
							}
							return true ;
						}
					}
				})]
			}]
		});
		this.callParent() ;
		
		this.on('beforedestroy', this.onBeforeDestroy, this) ;
		this.askSave = true ;
		
		this.buildBibleTree() ;
		this.loadCfg() ;
	},
	initComponentOnDefinitionRender: function(treeview){
		treeview.dropZone = Ext.create('Ext.dd.DropZone',treeview.getEl(),{
			ddGroup: 'DD-'+this.getId(),
			view: treeview,
			
			getTargetFromEvent : function(e) {
				var node = e.getTarget(this.view.getItemSelector()) ;
				return node ;
			},
			getTargetNode: function( node ) {
				var view = this.view,
					targetNode = view.getRecord(node) ;
				
				return targetNode ;
			},
			
			getAppendableChild: function(srcRecord, targetDestRecord) {
				switch( srcRecord.get('node_type') ) {
					case 'UO' :
						if( targetDestRecord.get('node_type') != 'WHSE' ) {
							return null ;
						}
						if( targetDestRecord.findChild('uo_code',srcRecord.get('uo_code')) != null ) {
							return null ;
						}
						return {
							children: [],
							expanded: true,
							node_type: 'UO',
							uo_code: srcRecord.get('uo_code')
						}
						break ;
						
					case 'ROLE' :
						if( targetDestRecord.get('node_type') != 'UO' ) {
							return null ;
						}
						if( targetDestRecord.findChild('role_code',srcRecord.get('role_code')) != null ) {
							return null ;
						}
						return {
							leaf: true,
							node_type: 'ROLE',
							role_code: srcRecord.get('role_code'),
							role_hRate: 0
						}
						break ;
				}
			},
			
			onNodeOver: function(node,dragZone,e,data) {
				var targetDestRecord = this.getTargetNode(node),
					srcRecord = data.records[0] ;
				if( targetDestRecord==null ) {
					return this.dropNotAllowed ;
				}
				var appendChild = this.getAppendableChild(srcRecord,targetDestRecord) ;
				if( appendChild == null ) {
					return this.dropNotAllowed ;
				}
				return this.dropAllowed ;
			},
			onNodeDrop: function(node,dragZone,e,data) {
				var targetDestRecord = this.getTargetNode(node),
					srcRecord = data.records[0] ;
				if( targetDestRecord==null ) {
					return false ;
				}
				var appendChild = this.getAppendableChild(srcRecord,targetDestRecord) ;
				if( appendChild == null ) {
					return false ;
				}
				
				targetDestRecord.appendChild(appendChild) ;
				
				return true ;
			}
		}) ;
	},
	buildBibleTree: function() {
		var sourceTreePanel = this.down('#tpSource'),
			uoChildren = [],
			roleChildren = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll('UO'), function(uoData) {
			uoChildren.push({
				leaf: true,
				node_type: 'UO',
				uo_code: uoData.id
			});
		}) ;
		Ext.Array.each( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll('ROLE'), function(roleData) {
			roleChildren.push({
				leaf: true,
				node_type: 'ROLE',
				role_code: roleData.id
			});
		}) ;
		
		sourceTreePanel.setRootNode({
			root: true,
			children: [{
				expanded: true,
				staticText: 'Unités d\'oeuvre (toutes)',
				children: uoChildren
			},{
				expanded: true,
				staticText: 'Roles (entrepôt '+this.whseCode+')',
				children: roleChildren
			}]
		})
	},
	loadCfg: function() {
		var params = {
			_moduleId: 'spec_dbs_people',
			_action: 'Forecast_getWeeks'
		};
		Ext.apply( params, {
			whse_code: this.whseCode,
			date_base_sql: Ext.Date.format( new Date(), 'Y-m-d' ),
			date_count: 0
		}) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: function(response) {
				this.onLoadCfg(response) ;
			},
			scope: this
		});
	},
	onLoadCfg: function(response) {
		var me = this,
			jsonResponse = Ext.JSON.decode(response.responseText) ;
		
		var forecastCfgUoStore = Ext.create('Ext.data.Store',{
			model: 'DbsPeopleForecastCfgUo',
			data: jsonResponse.data.cfg_uo,
			proxy: {
				type: 'memory' ,
				reader: {
					type: 'json'
				}
			}
		});
		
		var definitionTreePanel = this.down('#tpDefinition'),
			whseChildren = [] ;
		Ext.Array.each( forecastCfgUoStore.getRange(), function(uoRecord) {
			var uoChildren = [] ;
			Ext.Array.each( uoRecord.roles().getRange(), function(roleRecord) {
				uoChildren.push({
					leaf: true,
					node_type: 'ROLE',
					role_code: roleRecord.get('role_code'),
					role_hRate: roleRecord.get('role_hRate')
				});
			});
			whseChildren.push({
				expanded: true,
				children: uoChildren,
				node_type: 'UO',
				uo_code: uoRecord.get('uo_code')
			});
		}) ;
		definitionTreePanel.setRootNode({
			root: true,
			expanded: true,
			icon: 'images/op5img/ico_blocs_small.gif',
			node_type: 'WHSE',
			whse_code: this.whseCode,
			children: whseChildren
		});
	},
	
	doSave: function() {
		this.getEl().mask('Saving...');
		
		var definitionTreePanel = this.down('#tpDefinition'),
			uoData = [] ;
		Ext.Array.each( definitionTreePanel.getRootNode().childNodes, function(uoNode) {
			var rolesData = [] ;
			Ext.Array.each( uoNode.childNodes, function(roleNode) {
				rolesData.push({
					role_code: roleNode.get('role_code'),
					role_hRate: roleNode.get('role_hRate')
				});
			});
			uoData.push({
				uo_code: uoNode.get('uo_code'),
				roles: rolesData
			});
		}) ;
		
		var params = {
			_moduleId: 'spec_dbs_people',
			_action: 'Forecast_setCfgWhse'
		};
		Ext.apply( params, {
			whse_code: this.whseCode,
			cfg_uo: Ext.JSON.encode(uoData)
		}) ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: function() {
				this.onSaved() ;
			},
			scope: this
		});
	},
	onSaved: function() {
		this.getEl().unmask() ;
		
		this.destroy() ;
	},
	onBeforeDestroy: function() {
		if( this.askSave ) {
			this.askSave = false ;
			Ext.Msg.confirm('Save ?','Enregistrer config ?', function(btn) {
				if( btn == 'no' ) {
					this.destroy() ;
				}
				if( btn == 'yes' ) {
					this.doSave() ;
				}
			},this) ;
			
			return false ;
		}
		return ;
	}
}) ;