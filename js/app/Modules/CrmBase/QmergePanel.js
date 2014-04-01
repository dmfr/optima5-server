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
		{name: 'query_wherefield_idx',   type: 'int'},
		{name: 'query_groupfield_idx',   type: 'int'}
	]
});
Ext.define('QmergeMwhereModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'mfield_type',   type: 'string'},
		{name: 'mfield_linkbible',   type: 'string'},
		{name: 'condition_file_ids',   type: 'string'},
		{name: 'condition_bool',   type: 'string'},
		{name: 'condition_string',   type: 'string'},
		{name: 'condition_date_lt',   type: 'string'},
		{name: 'condition_date_gt',   type: 'string'},
		{name: 'condition_num_lt',   type: 'numeric'},
		{name: 'condition_num_gt',   type: 'numeric'},
		{name: 'condition_num_eq',   type: 'numeric'},
		{name: 'condition_bible_mode',   type: 'string'},
		{name: 'condition_bible_treenodes',   type: 'string'},
		{name: 'condition_bible_entries',   type: 'string'},
		{name: 'extrapolate_src_date_from',   type: 'string'},
		{name: 'extrapolate_calc_date_from',   type: 'string'},
		{name: 'extrapolate_calc_date_to',   type: 'string'}
	],
	hasMany: [{ 
		model: 'QmergeMwhereFieldModel',
		name: 'query_fields',
		associationKey: 'query_fields'
	}]
});

Ext.define('QmergeMselectFormulasymbolModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'sequence',  type: 'int'},
		{name: 'math_operation',   type: 'string'},
		{name: 'math_parenthese_in',   type: 'boolean'},
		{name: 'math_operand_query_id',   type: 'int'},
		{name: 'math_operand_selectfield_idx',   type: 'int'},
		{name: 'math_staticvalue',   type: 'numeric'},
		{name: 'math_parenthese_out',   type: 'boolean'}
	]
});
Ext.define('QmergeMselectAxisdetachModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'display_geometry',   type: 'string'},
		{name: 'axis_is_detach',   type: 'boolean'}
	]
});
Ext.define('QmergeMselectModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'select_lib',  type: 'string'},
		{name: 'math_func_mode', type: 'string'},
		{name: 'math_func_group', type: 'string'},
		{name: 'math_round', type: 'numeric'}
	],
	validations: [
		{type: 'length',    field: 'select_lib',     min: 1},
	],
	hasMany: [{ 
		model: 'QmergeMselectFormulasymbolModel',
		name: 'math_expression',
		associationKey: 'math_expression'
	},{
		model: 'QmergeMselectAxisdetachModel',
		name: 'axis_detach',
		associationKey: 'axis_detach'
	}]
});




Ext.define('Optima5.Modules.CrmBase.QmergePanel' ,{
	extend: 'Ext.panel.Panel',
			  
	alias: 'widget.op5crmbaseqmerge',
			  
	requires: [
		'Optima5.Modules.CrmBase.QmergeSubpanelMwhere',
		'Optima5.Modules.CrmBase.QmergeSubpanelMselect'
	] ,
			  
	
	transaction_id : 0 ,
	qmerge_id      : 0 ,
	qmerge_name    : '',
	
	bibleQueriesStore: null,
	bibleFilesTreefields: null,
	qmergeQueriesIds: [],
	qmergeGrouptagObj: null,
	mwhereStore : null ,  
	mselectStore: null ,
			  
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:QueryPanel','No module reference ?') ;
		}
		
		Ext.apply( me, {
			border: false,
			layout: 'border',
			//autoDestroy: true,
			items:[{
				region:'west',
				flex: 1.5,
				xtype: 'treepanel',
				itemId: 'bQueriesTree' ,
				title: 'All Queries',
				border: false,
				collapsible:true ,
				collapseDirection:'left',
				collapseMode:'header',
				collapsed: true ,
				headerPosition:'right',
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
				viewConfig: {
					plugins: {
						ptype: 'treeviewdragdrop',
						enableDrag: true,
						enableDrop: false,
						ddGroup: 'QueryToMqueries'+me.getId()
					}
				}
			},{
				region: 'center',
				itemId: 'bCenterPanel',
				flex: 4,
				border:false,
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: [{
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
							ddGroup: 'MqueriesToMpanels'+me.getId()
						}
					}
				},{
					xtype:'panel',
					itemId: 'mqueryCfg',
					flex: 3 ,
					frame:false,
					layout: {
						type: 'vbox',
						align: 'stretch'
					}
				}]
			}]
		}) ;
		
		me.callParent() ;
	},
	
	
	qmergeNew: function() {
		var me = this ;
		me.onLoadBegin() ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'queries_mergerTransaction',
			_subaction: 'init',
			is_new: 'true'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
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
		me.onLoadBegin() ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'queries_mergerTransaction',
			_subaction: 'init',
			qmerge_id: qmergeId,
			is_new: 'false'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
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
	
	onLoadBegin: function() {
		var me = this ;
		me.loading = true ;
		if( me.rendered ) {
			me.loadMask = Ext.create('Ext.LoadMask',{
				target: me,
				msg:"Please wait..."
			}) ;
			me.loadMask.show() ;
		} else {
			me.on('afterrender',function(p) {
				if( p.loading ) {
					return ;
				}
				p.loadMask = Ext.create('Ext.LoadMask',{
					target: p,
					msg:"Please wait..."
				}) ;
				p.loadMask.show() ;
			},me,{single:true}) ;
		}
	},
	onLoadEnd: function() {
		var me = this ;
		if( me.loadMask ) {
			me.loadMask.hide() ;
		}
		me.loading = false ;
	},
	
	addComponents: function( ajaxResponse ) {
		var me = this ;
		
		me.transaction_id = ajaxResponse.transaction_id ;
		if( ajaxResponse.qmerge_id && ajaxResponse.qmerge_id > 0 ) {
			me.qmerge_id = ajaxResponse.qmerge_id ;
			me.qmerge_name =  ajaxResponse.qmerge_name ;
		}
		
		/*
		***** Initialisation de la page *****
		
		- store $this->bibleQueriesStore : toutes queries "simples" déjà enregistrées dans le CRM
		
		- store $this->bibleFilesmapStore : tous "arbres" de description des champs pour chaque CRMfile $this->bibleQueriesStore->"target_file_code"
		Note : utilisation pour récup des libellés de champ
		
		- store $this->mwhereStore : paramètres WHERE fusionnés pour les subQueries
		- store $this->mselectStore : paramètres SELECT de la mQuery
		
		- tree itemId=bQueriesTree : toutes queries simple CRM
		- tree itemId=bCenterPanel>mqueryTree : queries liées à ce Qmerge, champs where+select développés dans D&D
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
		
		me.qmergeQueriesIds = [] ;
		Ext.Array.each( ajaxResponse.qmerge_queries, function(v) {
			var val = parseInt(v) ;
			me.qmergeQueriesIds.push(val) ;
		},me);
		
		me.mwhereStore = Ext.create('Ext.data.Store',{
			autoLoad: true,
			sortOnLoad: false,
			sortOnFilter: false,
			model: 'QmergeMwhereModel',
			data : ajaxResponse.qmerge_mwherefields , //me.mwhereFields
			proxy: {
				type: 'memory'
			}
		}) ;
		
		me.mselectStore = Ext.create('Ext.data.Store',{
			autoLoad: true,
			autoSync: true,
			model: 'QmergeMselectModel',
			data : ajaxResponse.qmerge_mselectfields , //me.mselectFields
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
		
		me.syncComponents() ;
		
		me.onLoadEnd() ;
	},
	addComponentsOnMqueryTreeRender: function( tree ) {
		var me = this ;
		
		var mqueryTreeDropTargetEl =  tree.body.dom;

		var mqueryTreeDropTarget = Ext.create('Ext.dd.DropTarget', mqueryTreeDropTargetEl, {
			ddGroup: 'QueryToMqueries'+me.getId(),
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
		***** Gestion des treeviews (bQueriesTree + bCenterPanel>mqueryTree) *****
		
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
		me.getComponent('bQueriesTree').getStore().setRootNode({
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
				
				// Fix : exclusion des conditions BIble / SINGLE
				if( queryWhereRecord.get('field_type') == 'link' && queryWhereRecord.get('condition_bible_mode') == 'SINGLE' ) {
					return ;
				}
				
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
			Ext.Array.each( queryRecord.fields_group().getRange() , function(queryGroupRecord,idx) {
				var queryTargetFilecode = queryRecord.get('target_file_code') ;
				var whereFieldcode = queryGroupRecord.get('field_code') ;
				var fieldtext = me.bibleFilesTreefields[queryTargetFilecode].getNodeById(whereFieldcode).get('field_text') ;
				
				// Fix : uniquement extrapolate_is_on
				if( queryGroupRecord.get('field_type') == 'date' && queryGroupRecord.get('extrapolate_is_on') == true ) {
				} else {
					return ;
				}
				
				nodeId++ ;
				mqueryParamsDetails.push({
					id:nodeId,
					text:fieldtext,
					query_field_type:'group',
					query_field_idx:idx,
					icon: 'images/wizard.png',
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
		me.getComponent('bCenterPanel').getComponent('mqueryTree').getStore().setRootNode({
			root:true,
			id:nodeId,
			text:'Queries',
			children:mqueryTreeChildren,
			expanded:true
		});
		
		// *** Recouverture du tree ? *** 
		if( me.qmergeQueriesIds.length <= 1 && me.getComponent('bQueriesTree').collapsed == true ) {
			me.getComponent('bQueriesTree').expand() ;
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
								break ;
							case 'TREE' :
								grouphash += '%'+'TREE'+'%'+queryGroupRecord.get('group_bible_tree_depth') ;
								break ;
						}
						break ;
						
					case 'date' :
						grouphash += 'DATE'+'%'+queryGroupRecord.get('group_date_type') ;
						break ;
						
					case 'file' :
						grouphash += 'FILE'+'%'+queryGroupRecord.get('field_code') ; ;
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
				
				// tag du groupage :
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
						
					case 'file' :
						grouptag += 'FILE'+'%'+queryGroupRecord.get('field_code') ;
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
		
		/*
		if( Ext.Object.getSize( probeGeoGrouphashArrQueries.grid_x ) <= 1 ) {
			
		} else {
			isValid = false ;
		}
		*/
		
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
		// *** store pour groupSubpanel "CFG detach" tree
		me.qmergeGrouptagObj = probeGeoGrouptagArrQueries ;
		
		
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
		var me = this,
			panel = me.getComponent('bCenterPanel').getComponent('mqueryCfg') ;
		panel.removeAll() ;
		panel.add({
			xtype:'panel',
			frame: true ,
			flex: 1
		});
	},
	mainpanelEnable: function( isValid ) {
		var me = this ;
		var panel = me.getComponent('bCenterPanel').getComponent('mqueryCfg') ;
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
			Ext.create('Optima5.Modules.CrmBase.QmergeSubpanelMwhere',{
				parentQmergePanel: me,
				mwhereStore: me.mwhereStore,
				flex:1,
				border:false
			}),
			Ext.create('Optima5.Modules.CrmBase.QmergeSubpanelMselect',{
				parentQmergePanel: me,
				qmergeGrouptagObj: me.qmergeGrouptagObj,
				mselectStore: me.mselectStore,
				flex:2,
				border:false
			})
		]) ;
	},



	remoteAction: function( actionCode, actionParam ) {
		var me = this ;
		switch( actionCode ) {
			case 'submit' :
				me.remoteActionSubmit( Ext.emptyFn, me ) ;
				break ;
			case 'save' :
				me.remoteActionSubmit( me.remoteActionSave, me ) ;
				break ;
			case 'saveas' :
				var newQueryName = actionParam ;
				me.remoteActionSubmit( me.remoteActionSaveAs, me, [newQueryName] ) ;
				break ;
			case 'delete' :
				me.remoteActionSubmit( me.remoteActionDelete, me ) ;
				break ;
				
			case 'toggle_publish' :
				var isPublished = actionParam ;
				me.remoteActionSubmit( me.remoteActionTogglePublish, me, [isPublished]  ) ;
				break ;
				
			case 'run' :
				me.remoteActionSubmit( me.remoteActionRun, me ) ;
				break ;
				
			default :
				break ;
		}
	},
	remoteActionSubmit: function( callback, callbackScope, callbackArguments ) {
		var me = this ;
		
		if( !callback ) {
			callback = Ext.emptyFn ;
		}
		
		var mwhereStoreData = [] ;
		var mwhereStoreRecords = me.mwhereStore.getRange();
		for (var i = 0; i < mwhereStoreRecords.length; i++) {
			saveObj = {} ;
			Ext.apply( saveObj, mwhereStoreRecords[i].data ) ;
			Ext.apply( saveObj, mwhereStoreRecords[i].getAssociatedData() ) ;
			mwhereStoreData.push(saveObj);
		}
		var mselectStoreData = [] ;
		var mselectStoreRecords = me.mselectStore.getRange();
		for (var i = 0; i < mselectStoreRecords.length; i++) {
			saveObj = {} ;
			Ext.apply( saveObj, mselectStoreRecords[i].data ) ;
			Ext.apply( saveObj, mselectStoreRecords[i].getAssociatedData() ) ;
			mselectStoreData.push(saveObj);
		}
		
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_mergerTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'submit',
					  
			qmerge_queries: Ext.JSON.encode(me.qmergeQueriesIds) ,
			qmerge_mwherefields: Ext.JSON.encode(mwhereStoreData) ,
			qmerge_mselectfields: Ext.JSON.encode(mselectStoreData)
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					callback.call( me, callbackArguments ) ;
				}
			},
			scope: me
		});
	},
	remoteActionSave: function() {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_mergerTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'save'
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					me.fireEvent('querysaved',false) ;
				}
				else {
					me.optimaModule.postCrmEvent('querychange') ;
					me.fireEvent('querysaved',true,Ext.decode(response.responseText).qmerge_id) ;
				}
			},
			scope: me
		});
	},
	remoteActionSaveAs: function( newQueryName ) {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_mergerTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'saveas',
			qmerge_name: newQueryName
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					me.fireEvent('querysaved',false) ;
				}
				else {
					me.optimaModule.postCrmEvent('querychange') ;
					me.fireEvent('querysaved',true,Ext.decode(response.responseText).qmerge_id) ;
				}
			},
			scope: me
		});
	},
	remoteActionDelete: function() {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_mergerTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'delete'
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					me.fireEvent('querydelete',false) ;
				}
				else {
					me.optimaModule.postCrmEvent('querychange') ;
					me.fireEvent('querydelete',true ) ;
					me.destroy() ;
				}
			},
			scope: me
		});
	},
	remoteActionTogglePublish: function( isPublished ) {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_mergerTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'toggle_publish',
			isPublished: isPublished
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.optimaModule.postCrmEvent('togglepublishquery',{
						qType:'qmerge',
						qmergeId:me.qmerge_id
					}) ;
				}
			},
			scope: me
		});
	},
	remoteActionRun: function() {
		var me = this ;
		var msgbox = Ext.Msg.wait('Running query. Please Wait.');
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'queries_mergerTransaction',
			_transaction_id: me.transaction_id ,
			_subaction: 'run'
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				msgbox.close() ;
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					if( ajaxData.query_error ) {
						Ext.Msg.alert('Query status', ajaxData.query_error);
					} else {
						Ext.Msg.alert('Failed', 'Unknown error / Missing parameters');
					}
				}
				else {
					// do something to open window
					me.openQueryResultPanel( ajaxData.RES_id ) ;
				}
			},
			scope: me
		});
	},
	openQueryResultPanel: function( resultId ) {
		var me = this ;
		
		var baseAjaxParams = new Object() ;
		Ext.apply( baseAjaxParams, {
			_action: 'queries_mergerTransaction',
			_transaction_id : me.transaction_id
		});
		
		var queryResultPanel = Ext.create('Optima5.Modules.CrmBase.QueryResultPanel',{
			optimaModule:me.optimaModule,
			ajaxBaseParams: baseAjaxParams,
			RES_id: resultId
		}) ;
		me.optimaModule.createWindow({
			title:me.qmerge_name ,
			width:800,
			height:600,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			items: [ queryResultPanel ]
		}) ;
		
		queryResultPanel.on('beforedestroy',function(destroyedpanel){
			if( destroyedpanel.up('window') ) {
				destroyedpanel.up('window').close() ;
			}
		});
	}
});