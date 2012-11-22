Ext.define('QmergeQueryModel', {
	extend: 'Ext.data.Model',
	idProperty: 'query_id',
	fields: [
		{name: 'query_id',  type: 'int'},
		{name: 'query_name',   type: 'string'},
		{name: 'target_file_code',   type: 'string'}
	],
	hasMany: [{ 
		model: 'QueryWhereModel',
		name: 'fields_where',
		associationKey: 'fields_where'
	},{
		model: 'QueryGroupModel',
		name: 'fields_group',
		associationKey: 'fields_group'
	},{
		model: 'QuerySelectModel',
		name: 'fields_select',
		associationKey: 'fields_select'
	},{
		model: 'QueryProgressModel',
		name: 'fields_progress',
		associationKey: 'fields_progress'
	}]
});
Ext.define('QmergeItemsTreeModel', {
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id',  type: 'int'},
		{name: 'text', type:'string'},
		{name: 'query_id',  type: 'int'},
		{name: 'query_name',  type: 'string'},
		{name: 'query_field_type',   type: 'string'},
		{name: 'query_field_idx',   type: 'string'},
		{name: 'query_field_text',   type: 'string'}
	]
});

Ext.define('QmergeMwhereFieldModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'query_id',   type: 'int'},
		{name: 'query_wherefield_idx',   type: 'int'}
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


Ext.define('Optima5.Modules.ParaCRM.QmergePanel' ,{
	extend: 'Ext.panel.Panel',
			  
	alias: 'widget.op5paracrmqmerge',
			  
	requires: [
		'Optima5.Modules.ParaCRM.QmergeSubpanelMwhere'
	] ,
			  
	
	transaction_id : 0 ,
	qmerge_id      : 0 ,
	qmerge_name    : '',
	
	bibleQueriesStore: null,
	bibleFilesTreefields: null,
	qmergeQueriesIds: [],
	qmergeGroupsStore: null,
	mwhereStore : null ,  
			  
			  
	initComponent: function() {
		var me = this ;
		Ext.apply( me, {
			border:true,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			autoDestroy: true
		}) ;
		
		me.qmergePanelCfg = {} ;
		Ext.apply(me.qmergePanelCfg,{
			
			
		});
		
		me.callParent() ;
		
		me.on({
			scope: me,
			activate: me.createPanel,
			deactivate: me.destroyPanel
		});
	},
			  
			  
	
	
	createPanel: function(){
		var me = this ;
		
		me.isActive = true ;
		
		me.removeAll();
		if( me.loadMask == null ) {
			me.loadMask = Ext.create('Ext.LoadMask',me,{msg:'Wait...'}) ;
		}
		me.loadMask.show() ;
	},
	destroyPanel: function(){
		var me = this ;
		
		me.isActive = false ;
		me.removeAll();
		me.bibleQueriesStore = null ;
	},

	qmergeNew: function() {
		var me = this ;
		if( me.isVisible() ){
			me.destroyPanel() ;
			me.createPanel() ;
		}
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'queries_mergerTransaction',
			_subaction: 'init',
			is_new: 'true'
		});
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.transaction_id = Ext.decode(response.responseText).transaction_id ;
					me.addComponents( Ext.decode(response.responseText) ) ;
				}
			},
			scope: this
		});
	},
	qmergeOpen: function( qmergeId ) {
		var me = this ;
		if( me.isVisible() ){
			me.destroyPanel() ;
		}
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'queries_mergerTransaction',
			_subaction: 'init',
			qmerge_id: qmergeId,
			is_new: 'false'
		});
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.qmerge_id = qmergeId ;
					me.qmerge_name = Ext.decode(response.responseText).qmerge_name ;
					me.transaction_id = Ext.decode(response.responseText).transaction_id ;
					me.addComponents( Ext.decode(response.responseText) ) ;
				}
			},
			scope: this
		});
	},
	addComponents: function( ajaxResponse ) {
		/*
		***** Initialisation de la page *****
		
		- store $this->bibleQueriesStore : toutes queries "simples" déjà enregistrées dans le CRM
		
		- store $this->bibleFilesmapStore : tous "arbres" de description des champs pour chaque CRMfile $this->bibleQueriesStore->"target_file_code"
		Note : utilisation pour récup des libellés de champ
		
		- store $this->mwhereStore : paramètres WHERE fusionnés pour les subQueries
		
		- tree itemId=queriesTree : toutes queries simple CRM
		- tree itemId=mqueryTree : queries liées à ce Qmerge, champs where+select développés dans D&D
		Note : tree actifs mais vides !
		Note2: gestion du contenu des trees dans syncComponents
		
		***************************************
		*/
		var me = this ;
		
		me.bibleQueriesStore = Ext.create('Ext.data.Store',{
			autoLoad: true,
			autoSync: true,
			model: 'QmergeQueryModel',
			data : ajaxResponse.bible_queries,
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
		
		me.bibleFilesTreefields = {} ;
		Ext.Object.each( ajaxResponse.bible_files_treefields, function(k,v) {
			var treestore = Ext.create('Ext.data.TreeStore',{
				model: 'QueryFieldsTreeModel',
				nodeParam: 'field_code',
				root: v
			});
			
			me.bibleFilesTreefields[k] = treestore ;
		},me) ;
		
		
		me.mwhereStore = Ext.create('Ext.data.Store',{
			autoLoad: true,
			sortOnLoad: false,
			sortOnFilter: false,
			model: 'QmergeMwhereModel',
			data : [] ,
			proxy: {
				type: 'memory'
			}
		}) ;
		
		
		
		var queriesTreeCfg = {} ;
		Ext.apply( queriesTreeCfg, {
			xtype: 'treepanel',
			itemId: 'queriesTree' ,
			title: 'All Queries',
			flex:1.5 ,
			width:100 ,
			collapsible:true ,
			collapseDirection:'left',
			collapseMode:'header',
			collapsed: (me.qmergeQueriesIds.length>0) ? true:false ,
			headerPosition:'left',
			useArrows: true,
			rootVisible: true,
			store: {
				model: 'QmergeItemsTreeModel',
				nodeParam: 'id',
				root: {
					root:true,
					id:1,
					text:'Queries',
					children:[],
					expanded:true
				}
			},
			listeners: {
				scrollershow: function(scroller) {
					if (scroller && scroller.scrollEl) {
						scroller.clearManagedListeners(); 
						scroller.mon(scroller.scrollEl, 'scroll', scroller.onElScroll, scroller); 
					}
				}
			},
			viewConfig: {
					plugins: {
						ptype: 'treeviewdragdrop',
						enableDrag: true,
						enableDrop: false,
						ddGroup: 'QueryToMqueries'
					}
			}
		}) ;
		me.add(queriesTreeCfg) ;

		var mqueryTreeCfg = {} ;
		Ext.apply( mqueryTreeCfg, {
			xtype: 'treepanel',
			itemId: 'mqueryTree' ,
			title: 'Merge Queries',
			flex: 1,
			useArrows: true,
			rootVisible: false,
			store: {
				model: 'QmergeItemsTreeModel',
				nodeParam: 'id',
				root: {
					root:true,
					id:1,
					text:'Queries',
					children:[]
				}
			},
			listeners: {
				scrollershow: function(scroller) {
					if (scroller && scroller.scrollEl) {
						scroller.clearManagedListeners(); 
						scroller.mon(scroller.scrollEl, 'scroll', scroller.onElScroll, scroller); 
					}
				},
				itemcontextmenu: function(view, record, item, index, event) {
					treeContextMenuItems = new Array() ;
					if( record.get('query_id') > 0 ) {
						treeContextMenuItems.push({
							iconCls: 'icon-bible-delete',
							text: 'Discard query',
							handler : function() {
								me.onQueryExclude( record.get('query_id') ) ;
							},
							scope : me
						});
					}
					if( treeContextMenuItems.length == 0 ) {
						return ;
					}
					
					var treeContextMenu = Ext.create('Ext.menu.Menu',{
						items : treeContextMenuItems
					}) ;
					
					treeContextMenu.showAt(event.getXY());
					
				},
				render: me.addComponentsOnMqueryTreeRender,
				scope: me
			},
			viewConfig: {
				plugins: {
					ptype: 'treeviewdragdrop',
					enableDrag: true,
					enableDrop: false,
					ddGroup: 'MqueriesToMwhere'
				}
			}
		}) ;
		me.add(mqueryTreeCfg) ;
		
		me.add({
			xtype:'panel',
			itemId: 'mqueryCfg',
			flex: 3 ,
			frame:false,
			layout: {
				type: 'vbox',
				align: 'stretch'
			}
		});
		
		
		me.syncComponents() ;
		me.loadMask.hide() ;
	},
	addComponentsOnMqueryTreeRender: function( tree ) {
		var me = this ;
		
		var mqueryTreeDropTargetEl =  tree.body.dom;

		var mqueryTreeDropTarget = Ext.create('Ext.dd.DropTarget', mqueryTreeDropTargetEl, {
			ddGroup: 'QueryToMqueries',
			notifyEnter: function(ddSource, e, data) {
					//Add some flare to invite drop.
					tree.body.stopAnimation();
					tree.body.highlight();
			},
			notifyDrop: function(ddSource, e, data){
					// Reference the record (single selection) for readability
					var selectedRecord = ddSource.dragData.records[0];
					
					if( !(selectedRecord.get('query_id') > 0) ) {
						return false ;
					}
					
					me.onQueryInclude( selectedRecord.get('query_id') ) ;
					
					return true;
			}
		});
	},
	syncComponents: function() {
		var me = this ;
		
		
		me.mainpanelDisable() ;
		
		/*
		***** Gestion des treeviews (queriesTree + mqueryTree) *****
		
		- tree itemId=queriesTree : toutes queries simple CRM
		- tree itemId=mqueryTree : queries liées à ce Qmerge, champs where+select développés dans D&D
		
		==> constitution des rootnodes
		***************************************
		*/
		var nodeId=0 ;
		
		var queriesTreeChildren = [] ;
		Ext.Array.each( me.bibleQueriesStore.getRange() , function(queryRecord) {
			if( me.qmergeQueriesIds != null && Ext.Array.contains(me.qmergeQueriesIds,queryRecord.get('query_id')) ) {
				return ;
			}
			
			//console.log(queryRecord.get('query_id')) ;
			nodeId++ ;
			queriesTreeChildren.push({
				id:nodeId,
				text:queryRecord.get('query_name'),
				query_id:queryRecord.get('query_id'),
				query_name:queryRecord.get('query_name'),
				icon: 'images/op5img/ico_process_16.gif',
				leaf:true
			}) ;
			
		},me) ;
		nodeId++ ;
		me.getComponent('queriesTree').getStore().setRootNode({
			root:true,
			id:nodeId,
			text:'Queries',
			children:queriesTreeChildren,
			expanded:true
		});
		
		
		var mqueryTreeChildren = [] ;
		var mqueryParamsDetails ;
		Ext.Array.each( me.qmergeQueriesIds , function(queryId) {
			var queryRecord = me.bibleQueriesStore.getById(queryId) ;
			if( queryRecord == null ) {
				Ext.Array.remove(me.qmergeQueriesIds,queryId) ;
				return ;
			}
			
			mqueryParamsDetails = [] ;
			Ext.Array.each( queryRecord.fields_where().getRange() , function(queryWhereRecord,idx) {
				var queryTargetFilecode = queryRecord.get('target_file_code') ;
				var whereFieldcode = queryWhereRecord.get('field_code') ;
				var fieldtext = me.bibleFilesTreefields[queryTargetFilecode].getNodeById(whereFieldcode).get('field_text') ;
				
				nodeId++ ;
				mqueryParamsDetails.push({
					id:nodeId,
					text:fieldtext,
					query_field_type:'where',
					query_field_idx:idx,
					icon: 'images/bogus.png',
					leaf:true
				}) ;
			},me) ;
			Ext.Array.each( queryRecord.fields_select().getRange() , function(querySelectRecord,idx) {
				nodeId++ ;
				mqueryParamsDetails.push({
					id:nodeId,
					text:querySelectRecord.get('select_lib'),
					query_field_type:'select',
					query_field_idx:idx,
					icon: 'images/add.png',
					leaf:true
				}) ;
			},me) ;
			
			//console.log(queryRecord.get('query_id')) ;
			nodeId++ ;
			mqueryTreeChildren.push({
				id:nodeId,
				text:queryRecord.get('query_name'),
				query_id:queryRecord.get('query_id'),
				query_name:queryRecord.get('query_name'),
				icon: 'images/op5img/ico_process_16.gif',
				children: mqueryParamsDetails,
				expanded:true
			}) ;
			
		},me) ;
		nodeId++ ;
		me.getComponent('mqueryTree').getStore().setRootNode({
			root:true,
			id:nodeId,
			text:'Queries',
			children:mqueryTreeChildren,
			expanded:true
		});
		
		// *** Recouverture du tree ? *** 
		if( me.qmergeQueriesIds.length <= 1 && me.getComponent('queriesTree').collapsed == true ) {
			// me.getComponent('queriesTree').expand() ;
		}
		
		
		/*
		***** Fusion des critères de groupage *****
		- Constitution de deux TAB/OBJ:
		  * geometry + hashstring de groupage  <= pour vérif compatibilité des requetes
		  * geometry + tag de type visuel (bible XXX, Date) <= pour utilisation dans le groupSubpanel de "CFG detach"
		  
		- Vérif de la compatibilité
		
		- Création du store pour groupSubpanel "CFG detach"
		*/
		var probeGeoGrouphashArrQueries = {
			undefined : {},
			tab : {},
			grid_y : {},
			grid_x : {}
		} ;
		var probeGeoGrouptagArrQueries = {} ;
		Ext.Array.each( me.qmergeQueriesIds , function(queryId) {
			var queryRecord = me.bibleQueriesStore.getById(queryId) ;
			if( queryRecord == null ) {
				Ext.Array.remove(me.qmergeQueriesIds,queryId) ;
				return ;
			}
			
			Ext.Array.each( queryRecord.fields_group().getRange() , function(queryGroupRecord,idx) {
				// geometry du groupage
				var geometry = queryGroupRecord.get('display_geometry') ;
				switch( geometry ) {
					case 'tab' :
						geometry = 'tab';
						break ;
					case 'grid-x' :
						geometry = 'grid_x';
						break ;
					case 'grid-y' :
						geometry = 'grid_y';
						break ;
					default :
						geometry = 'undefined' ;
						break ;
				}
				
				// hashstring du groupage :
				//    "BIBLE" % bible_code % t(tree)e(entry) [% treelevel]
				//    "DATE" % datetype
				var grouphash = '' ;
				switch( queryGroupRecord.get('field_type') ) {
					case 'link' :
						grouphash += 'BIBLE'+'%'+queryGroupRecord.get('field_linkbible') ;
						switch( queryGroupRecord.get('group_bible_type') ) {
							case 'ENTRY' :
								grouphash += '%'+'ENTRY' ;
							case 'TREE' :
								grouphash += '%'+'TREE'+'%'+queryGroupRecord.get('group_bible_tree_depth') ;
						}
						break ;
						
					case 'date' :
						grouphash += 'DATE'+'%'+queryGroupRecord.get('group_date_type') ;
						break ;
						
					default :
						grouphash += 'UNKNOWN' ;
						break ;
				}
				
				if( typeof probeGeoGrouphashArrQueries[geometry] === 'undefined' ) {
					probeGeoGrouphashArrQueries[geometry] = {} ;
				}
				if( typeof probeGeoGrouphashArrQueries[geometry][grouphash] === 'undefined' ) {
					probeGeoGrouphashArrQueries[geometry][grouphash] = [] ;
				}
				
				probeGeoGrouphashArrQueries[geometry][grouphash].push( queryId ) ;
				
			},me) ;
			
			
			
			Ext.Array.each( queryRecord.fields_group().getRange() , function(queryGroupRecord,idx) {
				// geometry du groupage
				var geometry = queryGroupRecord.get('display_geometry') ;
				switch( geometry ) {
					case 'tab' :
						geometry = 'tab';
						break ;
					case 'grid-x' :
						geometry = 'grid_x';
						break ;
					case 'grid-y' :
						geometry = 'grid_y';
						break ;
					default :
						geometry = 'undefined' ;
						break ;
				}
				
				// hashstring du groupage :
				//    "BIBLE" % bible_code % t(tree)e(entry) [% treelevel]
				//    "DATE" % datetype
				var grouptag = '' ;
				switch( queryGroupRecord.get('field_type') ) {
					case 'link' :
						grouptag += 'BIBLE'+'%'+queryGroupRecord.get('field_linkbible') ;
						break ;
						
					case 'date' :
						grouptag += 'DATE'+'%'+queryGroupRecord.get('group_date_type') ;
						break ;
						
					default :
						grouptag += 'UNKNOWN' ;
						break ;
				}
				
				if( typeof probeGeoGrouptagArrQueries[geometry] === 'undefined' ) {
					probeGeoGrouptagArrQueries[geometry] = {} ;
				}
				if( typeof probeGeoGrouptagArrQueries[geometry][grouptag] === 'undefined' ) {
					probeGeoGrouptagArrQueries[geometry][grouptag] = [] ;
				}
				
				probeGeoGrouptagArrQueries[geometry][grouptag].push( queryId ) ;
				
			},me) ;
		},me) ;
		
		
		// *** Compatibilité :
		//    - tab : 1 seul critère de groupage et toutes requêtes dedans
		//    - grid_x : 1 seul critère de groupage
		//    - grid_y : au moins 1 requete doit être présente dans la totalité des groupes
		var isValid = true ;
		
		if( Ext.Object.getSize( probeGeoGrouphashArrQueries.tab ) == 1 ) {
			if( probeGeoGrouphashArrQueries.tab[Ext.Object.getKeys(probeGeoGrouphashArrQueries.tab)[0]].length != me.qmergeQueriesIds.length ) {
				isValid = false ;
			}
		} else if( Ext.Object.getSize( probeGeoGrouphashArrQueries.tab ) == 0 ) {
			
		} else {
			isValid = false ;
		}
		
		if( Ext.Object.getSize( probeGeoGrouphashArrQueries.grid_x ) <= 1 ) {
			
		} else {
			isValid = false ;
		}
		
		if( Ext.Object.getSize( probeGeoGrouphashArrQueries.grid_y ) > 0 ) {
			var allQueryIds = Ext.clone( me.qmergeQueriesIds ) ;
			Ext.Object.each( probeGeoGrouphashArrQueries.grid_y , function( grouphash, queryIds ) {
				allQueryIds = Ext.Array.intersect( allQueryIds, queryIds ) ;
			},me) ;
			if( allQueryIds.length == 0 ) {
				isValid = false ;
			}
		}
		
		
		/*
		console.log( 'This is it' ) ;
		console.dir( probeGeoGrouptagArrQueries ) ;
		*/
		// *** store pour groupSubpanel "CFG detach"
		
		
		if( me.qmergeQueriesIds.length >= 1 ) {
			me.mainpanelEnable( isValid ) ;
		}
		else {
			me.mainpanelDisable() ;
		}
		if( !isValid ) {
			Ext.Msg.alert('QMerge error', 'Current selected queries are not compatible');
		}
	},
	
	onQueryInclude: function( queryId ) {
		var me = this ;
		if( !Ext.Array.contains(me.qmergeQueriesIds,queryId) ) {
			me.qmergeQueriesIds.push( queryId ) ;
		}
		me.syncComponents() ;
	},
	onQueryExclude: function( queryId ) {
		var me = this ;
		Ext.Array.remove(me.qmergeQueriesIds,queryId) ;
		me.syncComponents() ;
	},
			  
	mainpanelDisable: function() {
		var me = this ;
		me.getComponent('mqueryCfg').removeAll() ;
		me.getComponent('mqueryCfg').add({
			xtype:'panel',
			frame: true ,
			flex: 1
		});
	},
	mainpanelEnable: function( isValid ) {
		var me = this ;
		var panel = me.getComponent('mqueryCfg') ;
		panel.removeAll() ;
		if( !isValid ) {
			panel.add({
				xtype:'panel',
				frame: true ,
				flex: 1
			});
			return ;
		}

		panel.add([
			Ext.create('Optima5.Modules.ParaCRM.QmergeSubpanelMwhere',{
				mwhereStore: me.mwhereStore,
				flex:1,
				border:false
			}),{
				xtype:'panel',
				flex:2,
				border:false
			}
		]) ;
	}
});