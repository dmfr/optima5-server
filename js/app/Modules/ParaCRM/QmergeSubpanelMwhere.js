Ext.define('QmergeMwhereTreeModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'id',  type: 'int'},
		{name: 'text', type:'string'},
		{name: 'mfield_idx',  type: 'int'},
		{name: 'mfield_type',  type: 'string'},
		{name: 'query_id',  type: 'int'},
		{name: 'query_wherefield_idx',  type: 'int'}
	]
});


Ext.define('Optima5.Modules.ParaCRM.QmergeSubpanelMwhere' ,{
	extend: 'Optima5.Modules.ParaCRM.QmergeSubpanel',
			  
	alias: 'widget.op5paracrmqmergemwhere',
			  
	requires: [
		'Optima5.Modules.ParaCRM.QmergeSubpanel'
	] ,
			  
	mwhereStore : null ,
			  
	initComponent: function() {
		var me = this ;
		
		me.mwhereStore ;
		
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
			flex: 1,
			useArrows: true,
			rootVisible: true,
			store: {
				model: 'QmergeItemsTreeModel',
				nodeParam: 'id',
				root: {
					root:true,
					id:1,
					text:'Query Parameters',
					children:[]
				}
			},
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
	initComponentCreateTreeOnRender: function(tree) {
		var me = this ;
		
		var gridPanelDropTargetEl =  tree.body.dom;

		var gridPanelDropTarget = Ext.create('Ext.dd.DropTarget', gridPanelDropTargetEl, {
			ddGroup: 'MqueriesToMwhere',
			notifyEnter: function(ddSource, e, data) {
					//Add some flare to invite drop.
					tree.body.stopAnimation();
					tree.body.highlight();
			},
			notifyDrop: function(ddSource, e, data){
				// Reference the record (single selection) for readability
				var selectedRecord = ddSource.dragData.records[0];
				
				if( Ext.getClassName(selectedRecord) != 'QmergeItemsTreeModel' ) {
					return false ;
				}
				if( selectedRecord.get('query_field_type') != 'where' || selectedRecord.parentNode == null ) {
					return false ;
				}
				
				var queryId = selectedRecord.parentNode.get('query_id') ;
				var queryWherefieldIdx = selectedRecord.get('query_field_idx') ;
				me.wherefieldAdd( queryId , queryWherefieldIdx ) ;
				return true ;
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
			  
	wherefieldAdd: function( queryId, queryWherefieldIdx ) {
		var me = this ;
		
		me.syncTree() ;
	},
	wherefieldDel: function( queryId, queryWherefieldIdx ) {
		var me = this ;
		
		me.syncTree() ;
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