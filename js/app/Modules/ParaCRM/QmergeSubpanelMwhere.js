Ext.define('QmergeMwhereFieldModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'query_id',   type: 'int'},
		{name: 'query_wherefield_ssid',   type: 'int'}
	]
});
Ext.define('QmergeMwhereModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'mfield_type',   type: 'string'},
		{name: 'condition_string',   type: 'string'},
		{name: 'condition_date_lt',   type: 'string'},
		{name: 'condition_date_gt',   type: 'string'},
		{name: 'condition_num_lt',   type: 'numeric'},
		{name: 'condition_num_gt',   type: 'numeric'},
		{name: 'condition_num_eq',   type: 'numeric'},
		{name: 'condition_bible_mode',   type: 'string'},
		{name: 'condition_bible_treenodes',   type: 'string'},
		{name: 'condition_bible_entries',   type: 'string'}
	],
	hasMany: [{ 
		model: 'QmergeMwhereFieldModel',
		name: 'query_fields',
		associationKey: 'query_fields'
	}]
});

Ext.define('QmergeMwhereTreeModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'id',  type: 'int'},
		{name: 'text', type:'string'},
		{name: 'mfield_id',  type: 'int'},
		{name: 'mfield_type',  type: 'string'},
		{name: 'query_id',  type: 'int'},
		{name: 'query_wherefield_ssid',  type: 'int'}
	]
});


Ext.define('Optima5.Modules.ParaCRM.QmergeSubpanelMwhere' ,{
	extend: 'Optima5.Modules.ParaCRM.QmergeSubpanel',
			  
	alias: 'widget.op5paracrmqmergemwhere',
			  
	requires: [
		'Optima5.Modules.ParaCRM.QmergeSubpanel'
	] ,
			  
	mwhereFields : [] ,
			  
	initComponent: function() {
		var me = this ;
		
		me.store = Ext.create('Ext.data.Store',{
			autoLoad: true,
			sortOnLoad: false,
			sortOnFilter: false,
			model: 'QmergeMwhereModel',
			data : me.mwhereFields ,
			proxy: {
				type: 'memory'
			}
		}) ;
		
		Ext.apply( me, {
			title: 'Merge Conditions / Where?' ,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			autoDestroy: true ,
			items: [ Ext.apply(me.initComponentCreateTree(),{
				flex:1 
			}),Ext.apply(me.initComponentCreateFormpanel(),{
				flex:1
			})]
		}) ;
		
		me.callParent() ;
		me.syncTree() ;
		me.setFormpanelRecord(null) ;
	},
	initComponentCreateTree: function() {
		var me = this ;
		
		var tree = Ext.create('Ext.tree.Panel',{
			itemId: 'mqueryMwhereTree',
			store: me.store ,
			sortableColumns: false ,
			columns: [{
				header: 'Field Code',
				menuDisabled: true ,
				flex:1,
				dataIndex: 'field_code',
				renderer: function( value, metaData, record ) {
					return me.getQueryPanel().getTreeStore().getNodeById(record.get('field_code')).get('field_text_full') ;
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
									if( record.get('condition_bible_entries') ) {
										return record.get('condition_bible_entries') ;
									}
									if( record.get('condition_bible_treenodes') ) {
										return Ext.JSON.decode( record.get('condition_bible_treenodes') ).join(' ') ;
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
						
						default :
							return value ;
					}
				}
			}],
			listeners: {
				render: me.initComponentCreateTreeOnRender,
				scope: me
			}
		}) ;
		tree.on('itemclick', function( view, record, item, index, event ) {
			var selRecord = record ;
			
		},me) ;
		tree.on('itemcontextmenu', function(view, record, item, index, event) {
			// var strHeader = record.get('treenode_key')+' - '+record.get('entry_key')
			gridContextMenuItems = new Array() ;
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
				items : gridContextMenuItems
			}) ;
			
			gridContextMenu.showAt(event.getXY());
		},me) ;
		
		return tree ;
	},
	initComponentCreateTreeOnRender: function(grid) {
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
					var selectedRecord = ddSource.dragData.records[0];
					
					switch( selectedRecord.get('field_type') ) {
						case 'link' :
						case 'date' :
						case 'number' :
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
			  
	syncTree: function() {
		/*
		***** Gestion du treeviews mqueryMwhere conditions *****
		- tree itemId=mqueryMwhereTree
		==> constitution des rootnodes
			* text = verycustom renderer
			** pour les mfield : Type + renderer condition
			** pour les query_X : Nom requete + Nom du champ
		***************************************
		*/
		
		
	},
			  
	wherefieldAdd: function( queryId, queryWherefieldSsid ) {
		
	},
	wherefieldDel: function( queryId, queryWherefieldSsid ) {
		
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
			case 'link' :
				mform = Ext.create('Optima5.Modules.ParaCRM.QueryWhereFormBible',{
					bibleId: record.get('field_linkbible') ,
					frame:true
				}) ;
				break ;
				
			case 'date' :
				mform = Ext.create('Optima5.Modules.ParaCRM.QueryWhereFormDate',{
					frame:true
				}) ;
				break ;
				
			case 'number' :
				mform = Ext.create('Optima5.Modules.ParaCRM.QueryWhereFormNumber',{
					frame:true
				}) ;
				break ;
				
			default :
				mform = Ext.create('Optima5.Modules.ParaCRM.QueryWhereForm',{
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
						
						break ;
						
					default :
						return ;
				}
				record.set(k,v) ;
			},me) ;
		},me) ;
		
		me.formpanel.add( mform ) ;
	}
}) ;