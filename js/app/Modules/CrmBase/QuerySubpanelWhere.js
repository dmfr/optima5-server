Ext.define('QueryWhereModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'field_code',  type: 'string'},
		{name: 'field_type',   type: 'string'},
		{name: 'field_linkbible',   type: 'string'},
		{name: 'condition_forcevalue_isset',   type: 'boolean'},
		{name: 'condition_forcevalue_value',   type: 'number'},
		{name: 'condition_file_ids',   type: 'string'},
		{name: 'condition_bool',   type: 'string'},
		{name: 'condition_string',   type: 'string'},
		{name: 'condition_date_lt',   type: 'string'},
		{name: 'condition_date_gt',   type: 'string'},
		{name: 'condition_num_lt',   type: 'number'},
		{name: 'condition_num_gt',   type: 'number'},
		{name: 'condition_num_eq',   type: 'number'},
		{name: 'condition_bible_mode',   type: 'string'},
		{name: 'condition_bible_treenodes',   type: 'string'},
		{name: 'condition_bible_entries',   type: 'string'}
	]
});


Ext.define('Optima5.Modules.CrmBase.QuerySubpanelWhere' ,{
	extend: 'Optima5.Modules.CrmBase.QuerySubpanel',
			  
	alias: 'widget.op5crmbasequerywhere',
			  
	requires: [
		'Optima5.Modules.CrmBase.QuerySubpanel',
		'Optima5.Modules.CrmBase.QueryWhereFormBible',
		'Optima5.Modules.CrmBase.QueryWhereFormDate',
		'Optima5.Modules.CrmBase.QueryWhereFormString',
		'Optima5.Modules.CrmBase.QueryWhereFormNumber',
		'Optima5.Modules.CrmBase.QueryWhereFormBoolean',
		'Optima5.Modules.CrmBase.QueryWhereFormForcevalue'
	] ,
			  
	whereFields : [] ,
			  
	initComponent: function() {
		var me = this ;
		
		Ext.apply( me, {
			title: '"Where?" / Query Conditions' ,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			autoDestroy: true ,
			items: [ Ext.apply(me.initComponentCreateGrid(),{
				flex:1 
			}),Ext.apply(me.initComponentCreateFormpanel(),{
				flex:1
			})]
		}) ;
		
		me.callParent() ;
		
		me.setFormpanelRecord(null) ;
	},
	initComponentCreateGrid: function() {
		var me = this ;
		
		me.store = Ext.create('Ext.data.Store',{
			autoLoad: true,
			sortOnLoad: false,
			sortOnFilter: false,
			model: 'QueryWhereModel',
			data : me.whereFields ,
			proxy: {
				type: 'memory'
			}
		}) ;
		
		me.grid = Ext.create('Ext.grid.Panel',{
			store: me.store ,
			sortableColumns: false ,
			columns: [{
				header: 'Field Code',
				menuDisabled: true ,
				flex:1,
				dataIndex: 'field_code',
				renderer: function( value, metaData, record ) {
					if( record.get('field_type') == 'forcevalue' ) {
						return '<b>'+'(debug) Static value'+'</b>' ;
					}
					if( record.get('field_code') ) {
						var queryFieldsTreeRecord = me.getQueryPanel().getQueryPanelTreeStore().getNodeById(record.get('field_code')) ;
						return (queryFieldsTreeRecord ? queryFieldsTreeRecord.get('field_text_full') : '?') ;
					}
					return '?' ;
				}
			},{
				header: 'Clause',
				menuDisabled: true ,
				flex:1 ,
				renderer: function( value, metaData, record ) {
					switch( record.get('field_type') ) {
						case 'link' :
							switch( record.get('condition_bible_mode') ) {
								case 'SINGLE' :
									return '<i>Unique / Last occurence</i>' ;
								
								case 'SELECT' :
									if( record.get('condition_bible_entries') && Ext.JSON.decode( record.get('condition_bible_entries') ).length > 0 ) {
										return '<b>E:</b>' + '&#160;' + Ext.JSON.decode( record.get('condition_bible_entries') ).join(' ') ;
									}
									if( record.get('condition_bible_treenodes') && Ext.JSON.decode( record.get('condition_bible_treenodes') ).length > 0 ) {
										return '<b>T:</b>' + '&#160;' + Ext.JSON.decode( record.get('condition_bible_treenodes') ).join(' ') ;
									}
								default :
									return '<b>not set</b>' ;
							}
							break ;
							
						case 'date' :
							if( record.get('condition_date_lt') == '' && record.get('condition_date_gt') == '' ) {
								return '<b>not set</b>' ;
							}
							
							var str = '' ;
							if( record.get('condition_date_gt') != '' )
							{
								str = str + record.get('condition_date_gt') + ' < ' ;
							}
							str = str + '<b>X</b>' ;
							if( record.get('condition_date_lt') != '' )
							{
								str = str + ' < ' + record.get('condition_date_lt') ;
							}
							return str ;
						
						case 'number' :
							if( record.get('condition_num_lt') == 0 && record.get('condition_num_gt') == 0 ) {
								return '<b>not set</b>' ;
							}
							
							var str = '' ;
							str = str + record.get('condition_num_gt') + ' < ' ;
							str = str + '<b>X</b>' ;
							str = str + ' < ' + record.get('condition_num_lt') ;
							return str ;
						
						case 'bool' :
							return record.get('condition_bool') ;
						
						case 'string' :
							return record.get('condition_string') ;
						
						case 'file' :
							return '<b>to define</b>' ;
						
						case 'forcevalue' :
							if( !record.get('condition_forcevalue_isset') ) {
								return '<b>off</b>' ;
							}
							return record.get('condition_forcevalue_value') ;
						
						default :
							return value ;
					}
				}
			}],
			listeners: {
				render: me.onGridRender,
				drop: function(){
					me.query('gridpanel')[0].getStore().sync() ;
				},
				scope: me
			},
			viewConfig: {
					listeners: {
						drop: function(){
							me.store.sync() ;
						},
						scope: me
					},
					plugins: {
						ptype: 'gridviewdragdrop',
						ddGroup: 'querywherereorder'+me.getParentId()
					}
			}
		}) ;
		me.grid.on('itemclick', function( view, record, item, index, event ) {
			me.setFormpanelRecord( record ) ;
		},me) ;
		me.grid.on('itemcontextmenu', function(view, record, item, index, event) {
			// var strHeader = record.get('treenode_key')+' - '+record.get('entry_key')
			var gridContextMenuItems = new Array() ;
			if( true ) {
				gridContextMenuItems.push({
					iconCls: 'icon-bible-delete',
					text: 'Delete condition',
					handler : function() {
						me.setFormpanelRecord(null) ;
						me.store.remove(record) ;
					},
					scope : me
				});
			}
			
			var gridContextMenu = Ext.create('Ext.menu.Menu',{
				items : gridContextMenuItems,
				listeners: {
					hide: function(menu) {
						Ext.defer(function(){menu.destroy();},10) ;
					}
				}
			}) ;
			
			gridContextMenu.showAt(event.getXY());
		},me) ;
		me.grid.on('containercontextmenu', function(view, event) {
			// var strHeader = record.get('treenode_key')+' - '+record.get('entry_key')
			var gridContextMenuItems = new Array() ;
			if( true ) {
				gridContextMenuItems.push({
					iconCls: 'icon-bible-edit',
					text: 'Insert debug static value',
					handler : function() {
						var newRecord = Ext.create('QueryWhereModel',{
							field_type:'forcevalue'
						}) ;
						me.store.insert( 0, newRecord );
					},
					scope : me
				});
			}
			
			var gridContextMenu = Ext.create('Ext.menu.Menu',{
				items : gridContextMenuItems,
				listeners: {
					hide: function(menu) {
						Ext.defer(function(){menu.destroy();},10) ;
					}
				}
			}) ;
			
			gridContextMenu.showAt(event.getXY());
		},me) ;
		
		return me.grid ;
	},
	onGridRender: function(grid) {
		var me = this ;
		
		var gridPanelDropTargetEl =  grid.body.dom;

		var gridPanelDropTarget = Ext.create('Ext.dd.DropTarget', gridPanelDropTargetEl, {
			ddGroup: 'TreeToGrids'+me.getParentId(),
			notifyEnter: function(ddSource, e, data) {
					//Add some flare to invite drop.
					grid.body.stopAnimation();
					grid.body.highlight();
			},
			notifyDrop: function(ddSource, e, data){
					// Reference the record (single selection) for readability
					var selectedRecord = ddSource.dragData.records[0];
					
					switch( selectedRecord.get('field_type') ) {
						case 'link' :
						case 'date' :
						case 'string' :
						case 'number' :
						case 'file' :
						case 'bool' :
							break ;
						
						default :
							return false ;
					}
					
					var newRecord = Ext.create('QueryWhereModel',{
						field_code:selectedRecord.get('field_code'),
						field_type:selectedRecord.get('field_type'),
						field_linkbible:selectedRecord.get('field_linkbible')
					}) ;
					
					me.store.insert( 0, newRecord );

					/*
					// Load the record into the form
					formPanel.getForm().loadRecord(selectedRecord);
					// Delete record from the source store.  not really required.
					ddSource.view.store.remove(selectedRecord);
					*/
					return true;
			}
		});
	},
	initComponentCreateFormpanel: function(){
		var me = this ;
		
		me.formpanel = Ext.create('Ext.panel.Panel',{
			layout:'fit',
			border:false
		}) ;
		
		return me.formpanel ;
	},
	setFormpanelRecord: function( record ){
		var me = this ;
		me.formpanel.removeAll() ;
		if( record === null ) {
			me.formpanel.add({
				xtype:'panel',
				border:false,
				frame:true
			});
			return ;
		}
		
		var mform ;
		switch( record.get('field_type') ) {
			case 'bool' :
				mform = Ext.create('Optima5.Modules.CrmBase.QueryWhereFormBoolean',{
					optimaModule: me.optimaModule,
					frame:true
				}) ;
				break ;
				
			case 'link' :
				mform = Ext.create('Optima5.Modules.CrmBase.QueryWhereFormBible',{
					optimaModule: me.optimaModule,
					bibleId: record.get('field_linkbible') ,
					frame:true
				}) ;
				break ;
				
			case 'date' :
				mform = Ext.create('Optima5.Modules.CrmBase.QueryWhereFormDate',{
					optimaModule: me.optimaModule,
					frame:true
				}) ;
				break ;
				
			case 'string' :
				mform = Ext.create('Optima5.Modules.CrmBase.QueryWhereFormString',{
					optimaModule: me.optimaModule,
					frame:true
				}) ;
				break ;
				
			case 'number' :
				mform = Ext.create('Optima5.Modules.CrmBase.QueryWhereFormNumber',{
					optimaModule: me.optimaModule,
					frame:true
				}) ;
				break ;
				
			case 'forcevalue' :
				mform = Ext.create('Optima5.Modules.CrmBase.QueryWhereFormForcevalue',{
					optimaModule: me.optimaModule,
					frame:true
				}) ;
				break ;
				
			case 'file' :
				mform = Ext.create('Ext.panel.Panel',{
					optimaModule: me.optimaModule,
					frame:true,
					loadRecord: Ext.emptyFn
				}) ;
				break ;
				
			default :
				mform = Ext.create('Optima5.Modules.CrmBase.QueryWhereForm',{
					optimaModule: me.optimaModule,
					frame:true
				}) ;
				break ;
		}
		mform.loadRecord(record) ;
		
		mform.on('change',function(){
			Ext.Object.each( mform.getForm().getValues() , function(k,v){
				switch( k ) {
					case 'condition_bible_mode' :
					case 'condition_bible_treenodes' :
					case 'condition_bible_entries' :
						
					case 'condition_date_gt' :
					case 'condition_date_lt' :
						
					case 'condition_num_gt' :
					case 'condition_num_lt' :
						
					case 'condition_bool' :
						
					case 'condition_string' :
						
					case 'condition_forcevalue_isset' :
					case 'condition_forcevalue_value' :
						break ;
						
					default :
						return ;
				}
				if( k=='condition_forcevalue_isset' ) {
					switch( v ) {
						case 'true' :
							v=true ;
							break ;
						case 'false' :
							v=false;
							break ;
						default :
							return ;
					}
				}
				record.set(k,v) ;
			},me) ;
		},me) ;
		
		me.formpanel.add( mform ) ;
	}
}) ;