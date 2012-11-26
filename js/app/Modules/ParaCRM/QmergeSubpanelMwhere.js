Ext.define('QmergeMwhereTreeModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'id',  type: 'int'},
		{name: 'text', type:'string'},
		{name: 'mfield_idx',  type: 'int'},
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
				model: 'QmergeMwhereTreeModel',
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
			
			while( true ) {
				if( record == null || record.isRoot() ) {
					me.setFormpanelRecord(null) ;
					return ;
				}
				if( record.get('mfield_idx')==-1 ) {
					record = record.parentNode ;
					continue ;
				}
				
				var QmergeMwhereModelIdx = record.get('mfield_idx') ;
				var iQmergeMwhereModel = me.mwhereStore.getAt( QmergeMwhereModelIdx ) ;
				me.setFormpanelRecord(iQmergeMwhereModel) ;
				break ;
			}
			
		},me) ;
		tree.on('itemcontextmenu', function(view, record, item, index, event) {
			// var strHeader = record.get('treenode_key')+' - '+record.get('entry_key')
			gridContextMenuItems = new Array() ;
			if( record.isLeaf() ) {
				gridContextMenuItems.push({
					iconCls: 'icon-bible-delete',
					text: 'Delete condition',
					handler : function() {
						me.wherefieldDel( record.get('query_id') , record.get('query_wherefield_idx') ) ;
						me.setFormpanelRecord(null) ;
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
			ddGroup: 'MqueriesToMpanels',
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
		var me = this ;
		
		
		/*
		***** Gestion du treeviews mqueryMwhere conditions *****
		- tree itemId=mqueryMwhereTree
		==> constitution des rootnodes
			* text = verycustom renderer
			** pour les mfield : Type + renderer condition
			** pour les query_X : Nom requete + Nom du champ
		***************************************
		*/
		var bibleFilesTreefields = me.getQmergePanel().bibleFilesTreefields ;
		var bibleQueriesStore = me.getQmergePanel().bibleQueriesStore ;
		
		var nodeId = 0 ;
		
		var rootChildren = [] ;
		Ext.Array.each( me.mwhereStore.getRange(), function(iQmergeMwhereModel,mfield_idx) {
			
			var iQmergeMwhereModelChildren = [] ;
			Ext.Array.each( iQmergeMwhereModel.query_fields().getRange(), function(iQmergeMwhereFieldModel) {
				
				var queryId = iQmergeMwhereFieldModel.get('query_id') ;
				var queryWherefieldIdx = iQmergeMwhereFieldModel.get('query_wherefield_idx') ;
				
				var iQmergeQueryModel = bibleQueriesStore.getById(queryId) ;
				var iQueryWhereModel = iQmergeQueryModel.fields_where().getAt(queryWherefieldIdx) ;
				var queryTargetFilecode = iQmergeQueryModel.get('target_file_code') ;
				var whereFieldcode = iQueryWhereModel.get('field_code') ;
				
				var querytext = iQmergeQueryModel.get('query_name') ;
				var fieldtext = bibleFilesTreefields[queryTargetFilecode].getNodeById(whereFieldcode).get('field_text') ;
				
				
				nodeId++ ;
				iQmergeMwhereModelChildren.push({
					leaf:true,
					id: nodeId,
					text: querytext+' : '+fieldtext,
					mfield_idx: -1,
					query_id: queryId,
					query_wherefield_idx: queryWherefieldIdx,
					icon: 'images/dot_orange_16.gif',
				}) ;
				
			},me) ;
			
			var text ;
			switch( iQmergeMwhereModel.get('mfield_type') ) {
				case 'link' :
					text = '<u>Link</u>'+' <b>'+iQmergeMwhereModel.get('mfield_linkbible')+'</b>' ;
					break ;
					
				case 'date' :
					text = '<u>Date</u>' ;
					break ;
				
				default : iQmergeMwhereModel.get('mfield_type') ; break ;
			}
			var valueRender = me.syncTreeValueRenderer( iQmergeMwhereModel ) ;
			
			nodeId++ ;
			rootChildren.push({
				expanded:true,
				icon: 'images/bogus.png',
				children:iQmergeMwhereModelChildren,
				id:nodeId,
				text:text+': '+valueRender,
				mfield_idx: mfield_idx
			});
			
		},me) ;
		
		nodeId++ ;
		me.getComponent('mqueryMwhereTree').getStore().setRootNode({
			root:true,
			id:nodeId,
			text:'Query Parameters',
			children:rootChildren,
			expanded:true
		});
		
		
	},
	syncTreeValueRenderer: function( iQmergeMwhereModel ) {
		var record = iQmergeMwhereModel ;
		
		switch( record.get('mfield_type') ) {
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
				return '' ;
		}
	},
			  
	wherefieldAdd: function( queryId, queryWherefieldIdx ) {
		var me = this ;
		
		/*
		********** Ajout d'un WHERE dans les critères *********
		- chargement du modelRecord QueryWhereModel
		
		- store de gestion : $this->mwhereStore
		
		- type de WHERE => détermination d'un groupe (field_type + field_linkbible )
		   * création ou chargement du modèle QmergeMwhereModel
		
		- ajout du couple (queryId+queryWherefieldIdx ) > modelRecord QmergeMwhereFieldModel
		******************************************************
		*/
		
		var bibleQueriesStore, iQueryModel,iQueryWhereModel ;
		if(
			((bibleQueriesStore = me.getQmergePanel().bibleQueriesStore) == null ) ||
			((iQueryModel = bibleQueriesStore.getById(queryId)) == null ) ||
			((iQueryWhereModel = iQueryModel.fields_where().getAt(queryWherefieldIdx)) == null )
		) {
			console.log('wherefieldAdd : fatal error') ;
			return 
		}
		
		var iQmergeMwhereModel = me.mwhereStore.getAt( me.mwhereStore.findBy(function(testRecord){
			if( testRecord.get('mfield_type') == iQueryWhereModel.get('field_type')
				&& testRecord.get('mfield_linkbible') == iQueryWhereModel.get('field_linkbible') ) {
				
				return true ;
			}
			return false ;
		},me)) ;
		if( iQmergeMwhereModel == null ) {
			// création
			var iQmergeMwhereModel = Ext.create('QmergeMwhereModel',{
				mfield_type: iQueryWhereModel.get('field_type'),
				mfield_linkbible: iQueryWhereModel.get('field_linkbible')
			}) ;
			
			me.mwhereStore.insert( me.mwhereStore.getCount() , iQmergeMwhereModel ) ;
		}
		
		var QmergeMwhereFieldModelIdx = iQmergeMwhereModel.query_fields().findBy( function(testRecord) {
			if( testRecord.get('query_id') == queryId
				&& testRecord.get('query_wherefield_idx') == queryWherefieldIdx ) {
				
				// already exists
				return true ;
			}
			return false ;
		},me) ;
		if( QmergeMwhereFieldModelIdx != -1 ) {
			// already exists
			return ;
		}
		
		iQmergeMwhereModel.query_fields().insert( iQmergeMwhereModel.query_fields().getCount(), Ext.create('QmergeMwhereFieldModel',{
			query_id: queryId,
			query_wherefield_idx: queryWherefieldIdx
		})) ;
		
		me.syncTree() ;
	},
	wherefieldDel: function( queryId, queryWherefieldIdx ) {
		var me = this ;
		
		Ext.Array.each( me.mwhereStore.getRange(), function(iQmergeMwhereModel) {
			Ext.Array.each( iQmergeMwhereModel.query_fields().getRange(), function(iQmergeMwhereFieldModel) {
				if( iQmergeMwhereFieldModel.get('query_id') == queryId
					&& iQmergeMwhereFieldModel.get('query_wherefield_idx') == queryWherefieldIdx ) {
					
					iQmergeMwhereModel.query_fields().remove( iQmergeMwhereFieldModel ) ;
				}
			},me) ;
			
			if( iQmergeMwhereModel.query_fields().getCount() == 0 ) {
				me.mwhereStore.remove( iQmergeMwhereModel ) ;
			}
		},me) ;
		
		
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
		switch( record.get('mfield_type') ) {
			case 'link' :
				mform = Ext.create('Optima5.Modules.ParaCRM.QueryWhereFormBible',{
					bibleId: record.get('mfield_linkbible') ,
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
			
			me.syncTree() ;
		},me) ;
		
		me.formpanel.add( mform ) ;
	}
}) ;