Ext.define('QueryGroupModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'field_code',  type: 'string'},
		{name: 'field_type',   type: 'string'},
		{name: 'field_linkbible',   type: 'string'},
		{name: 'display_geometry',   type: 'string'},
		{name: 'group_bible_type',   type: 'string'},
		{name: 'group_bible_tree_depth',   type: 'int'},
		{name: 'group_bible_display_treenode',   type: 'string'},
		{name: 'group_bible_display_entry',   type: 'string'},
		{name: 'group_date_type',   type: 'string'}
	]
});


Ext.define('Optima5.Modules.CrmBase.QuerySubpanelGroup' ,{
	extend: 'Optima5.Modules.CrmBase.QuerySubpanel',
			  
	alias: 'widget.op5crmbasequerygroup',
			  
	requires: [
		'Optima5.Modules.CrmBase.QuerySubpanel',
		'Optima5.Modules.CrmBase.QueryGroupFormDate',
		'Optima5.Modules.CrmBase.QueryGroupFormBible'
	] ,
	
	groupFields : [] ,
			  
	initComponent: function() {
		var me = this ;
		
		Ext.apply( me, {
			title: '"What?" / Group fields' ,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			autoDestroy: true ,
			items: [ Ext.apply(me.initComponentCreateGrid(),{
				flex:1 
			}),Ext.apply(me.initComponentCreateGroupPanel(),{
				flex:1 
			})]
		}) ;
		
		me.callParent() ;
		
		me.setGroupRecord(null) ;
	},
	initComponentCreateGrid: function() {
		var me = this ;
		
		var store = Ext.create('Ext.data.Store',{
			autoLoad: true,
			autoSync: true,
			model: 'QueryGroupModel',
			data : me.groupFields,
			proxy: {
				type: 'memory' ,
				reader: {
						type: 'json'
				},
				writer: {
					type:'json',
					writeAllFields: true
				}
			}
		}) ;
		
		
		var grid = Ext.create('Ext.grid.Panel',{
			plugins: [Ext.create('Ext.grid.plugin.RowEditing')],
			store: store ,
			sortableColumns: false ,
			columns: [{
				menuDisabled: true ,
				header: 'Field Code',
				dataIndex: 'field_code',
				flex:1,
				renderer: function( value, metaData, record ) {
					return me.getQueryPanel().getTreeStore().getNodeById(record.get('field_code')).get('field_text_full') ;
				}
			},{
				menuDisabled: true ,
				header: 'Geometry',
				dataIndex: 'display_geometry',
				flex:1 ,
				editor : {
					xtype: 'combobox',
					name: 'display_geometry',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['display_geometry','lib'],
						data : [
							{display_geometry:'tab', lib:'Book tab'},
							{display_geometry:'grid-x', lib:'Grid X'},
							{display_geometry:'grid-y', lib:'Grid Y'}
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'display_geometry'
				},
				renderer: function(value) {
					switch( value ) {
						case 'tab' : return 'Book tab' ;
						case 'grid-x' : return 'Grid X' ;
						case 'grid-y' : return 'Grid Y' ;
						default : return value ;
					}
				}
			}],
			listeners: {
				render: me.initComponentCreateGridOnRender,
				scope: me
			},
			viewConfig: {
				plugins: {
					ptype: 'gridviewdragdrop',
					ddGroup: 'querygroupreorder'
				}
			}
		}) ;
		
		grid.getSelectionModel().on('selectionchange', function(selModel, selections){
			me.setGroupRecord( selections[0] ) ;
		},me);
		grid.on('itemcontextmenu', function(view, record, item, index, event) {
			// var strHeader = record.get('treenode_key')+' - '+record.get('entry_key')
			gridContextMenuItems = new Array() ;
			if( true ) {
				gridContextMenuItems.push({
					iconCls: 'icon-bible-delete',
					text: 'Delete group clause',
					handler : function() {
						me.setGroupRecord(null) ;
						store.remove(record) ;
					},
					scope : me
				});
			}
			
			var gridContextMenu = Ext.create('Ext.menu.Menu',{
				items : gridContextMenuItems
			}) ;
			
			gridContextMenu.showAt(event.getXY());
		},me) ;
		
		return grid ;
	},
	initComponentCreateGridOnRender: function(grid) {
		var me = this ;
		
		var gridPanelDropTargetEl =  grid.body.dom;

		var gridPanelDropTarget = Ext.create('Ext.dd.DropTarget', gridPanelDropTargetEl, {
			ddGroup: 'TreeToGrids',
			notifyEnter: function(ddSource, e, data) {
					//Add some flare to invite drop.
					grid.body.stopAnimation();
					grid.body.highlight();
			},
			notifyDrop: function(ddSource, e, data){
					// Reference the record (single selection) for readability
					var insertPosition = grid.getStore().getCount() ;
					
					var selectedRecord = ddSource.dragData.records[0];
					
					switch( selectedRecord.get('field_type') ) {
						case 'link' :
						case 'date' :
							break ;
						
						default :
							return false ;
					}
					
					var newRecord = Ext.create('QueryGroupModel',{
						field_code:selectedRecord.get('field_code'),
						field_type:selectedRecord.get('field_type'),
						field_linkbible:selectedRecord.get('field_linkbible')
					}) ;
					
					grid.getStore().insert( insertPosition, newRecord );
					grid.getView().getSelectionModel().select(insertPosition) ;
					
					grid.plugins[0].startEdit( insertPosition, 0 ) ;

					return true;
			}
		});
	},
	initComponentCreateGroupPanel: function(){
		var me = this ;
		
		me.grouppanel = Ext.create('Ext.panel.Panel',{
			layout:'fit',
			border:false
		}) ;
		
		return me.grouppanel ;
	},
			  
			  
	setGroupRecord: function( record ) {
		var me = this ;
		me.grouppanel.removeAll() ;
		if( typeof record === 'undefined' || record === null ) {
			me.grouppanel.add({
				xtype:'panel',
				border:false,
				frame:true
			});
			return ;
		}
		
		var mform ;
		switch( record.get('field_type') ) {
			case 'link' :
				mform = Ext.create('Optima5.Modules.CrmBase.QueryGroupFormBible',{
					bibleId: record.get('field_linkbible') ,
					bibleMapNode: me.getQueryPanel().getTreeStore().getNodeById( record.get('field_code') ),
					frame:true
				}) ;
				break ;
				
			case 'date' :
				mform = Ext.create('Optima5.Modules.CrmBase.QueryGroupFormDate',{
					frame:true
				}) ;
				break ;
				
			default :
				mform = Ext.create('Optima5.Modules.CrmBase.QueryGroupForm',{
					frame:true
				}) ;
				break ;
		}
		mform.loadRecord(record) ;
		
		mform.on('change',function(){
			Ext.Object.each( mform.getForm().getFieldValues() , function(k,v){
				// console.log( k + '    ' + v ) ;
				
				switch( k ) {
					case 'group_bible_type' :
					case 'group_bible_tree_depth' :
						record.set(k,v) ;
						break ;
					case 'group_bible_display_treenode' :
					case 'group_bible_display_entry' :
						record.set(k,Ext.JSON.encode(v)) ;
						break ;
						
					case 'group_date_type' :
						record.set(k,v) ;
						break ;
						
					default :
						return ;
				}
			},me) ;
		},me) ;
		
		me.grouppanel.add( mform ) ;
	}
}) ;