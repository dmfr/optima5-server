Ext.define('QbookBibleQobjTreeModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'text', type:'string'},
		{name: 'q_type',  type: 'string'},
		{name: 'query_id',  type: 'int'},
		{name: 'qmerge_id',   type: 'int'}
	]
});

Ext.define('QbookQobjTreeModel', {
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'text', type:'string'},
		// level 1 :
		{name: 'jsId',  type: 'string'},
		{name: 'target_q_type',  type: 'string'},
		{name: 'target_query_id',   type: 'int'},
		{name: 'target_qmerge_id',   type: 'int'},
		// level 2 :
		{name: 'target_query_wherefield_idx',   type: 'int'},
		{name: 'target_qmerge_mwherefield_idx',   type: 'int'},
		{name: 'field_type',   type: 'string'},
		{name: 'field_linkbible',   type: 'string'}
	]
});


Ext.define('Optima5.Modules.CrmBase.QbookSubpanelQprocess' ,{
	extend: 'Optima5.Modules.CrmBase.QbookSubpanel',
			  
	alias: 'widget.op5crmbaseqbookqprocess',
	
	inputvarStore : null ,
	qobjStore : null ,

	requires: [
		'Optima5.Modules.CrmBase.QbookQprocessFormExtrapolate',
		'Optima5.Modules.CrmBase.QbookQprocessFormDate',
		'Optima5.Modules.CrmBase.QbookQprocessFormNumber',
		'Optima5.Modules.CrmBase.QbookQprocessFormString',
		'Optima5.Modules.CrmBase.QbookQprocessFormBible',
		'Optima5.Modules.CrmBase.QbookQprocessFormFile',
		'Optima5.Modules.CrmBase.QbookQprocessFormForcevalue'
	],
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(this,{
			layout: {
				type: 'border',
				align: 'stretch'
			},
			items:[{
				region:'west',
				flex: 1,
				xtype: 'treepanel',
				itemId: 'bQueriesTree' ,
				title: 'All Queries',
				border: false,
				collapsible:false ,
				collapseDirection:'left',
				collapseMode:'header',
				collapsed: false,
				headerPosition:'right',
				useArrows: true,
				rootVisible: true,
				store: {
					model: 'QbookBibleQobjTreeModel',
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
						ddGroup: 'QobjToQbookQobjs'+me.getParentId()
					}
				}
			},{
				xtype:'panel',
				itemId: 'pCenter' ,
				region:'center',
				flex: 3,
				border: false,
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items:[{
					xtype:'treepanel',
					itemId: 'pCenterTree',
					flex: 1,
					useArrows: true,
					rootVisible: true,
					store: {
						model: 'QbookQobjTreeModel',
						nodeParam: 'id',
						root: {
							root:true,
							id:1,
							text:'Query Parameters',
							children:[]
						}
					},
					viewConfig: {
						preserveScrollOnRefresh:true,
						listeners: {
							beforerefresh: function(tv) {
								if( tv.scrollStateSaved ) {
									return ;
								}
								tv.saveScrollState() ;
								tv.scrollStateSaved = true ;
							},
							refresh: function(tv) {
								Ext.defer( function() {
									tv.restoreScrollState() ;
									tv.scrollStateSaved = false ;
								},100) ;
							}
						}
					},
					listeners: {
						itemclick: function( view, record, item, index, event ) {
							if( record.getDepth() == 2 ) {
								me.setFormpanelRecord( record ) ;
							} else {
								me.setFormpanelRecord( null ) ;
							}
						},
						itemcontextmenu: function(view, record, item, index, event) {
							if( record.getDepth() != 1 ) {
								return ;
							}
							
							var jsId = record.get('jsId'),
								qobjRecord = me.qobjStore.getById(jsId),
								qobjRecordIdx = me.qobjStore.indexOf(qobjRecord),
								isLast = (qobjRecordIdx == (me.qobjStore.getCount()-1)),
								isFirst = (qobjRecordIdx==0) ;
							
							var gridContextMenuItems = new Array() ;
							gridContextMenuItems.push({
								text: 'Rename as',
								handler: null,
								menu: {
									items:[{
										xtype:'textfield',
										value: qobjRecord.get('qobj_lib'),
										width:150
									},{
										xtype:'button',
										text:'OK',
										handler: function(button){
											var textfield = button.up('menu').query('textfield')[0] ;
											me.onQobjRename( qobjRecord, textfield.getValue() ) ;
											Ext.menu.Manager.hideAll();
										},
										scope:me
									}]
								},
								scope: me
							});
							gridContextMenuItems.push('-') ;
							if( !isFirst ) {
								gridContextMenuItems.push({
									iconCls: 'icon-move-up',
									text: 'Move up',
									handler : function() {
										me.onQobjMove( qobjRecord, -1 ) ;
									},
									scope : me
								});
							}
							if( !isLast ) {
								gridContextMenuItems.push({
									iconCls: 'icon-move-down',
									text: 'Move down',
									handler : function() {
										me.onQobjMove( qobjRecord, +1 ) ;
									},
									scope : me
								});
							}
							gridContextMenuItems.push('-') ;
							gridContextMenuItems.push({
								iconCls: 'icon-bible-delete',
								text: 'Delete condition',
								handler : function() {
									//me.setFormpanelRecord(null) ;
									me.onQobjDelete( qobjRecord ) ;
								},
								scope : me
							});
							
							var gridContextMenu = Ext.create('Ext.menu.Menu',{
								items : gridContextMenuItems,
								listeners: {
									hide: function(menu) {
										Ext.defer(function(){menu.destroy();},10) ;
									}
								}
							}) ;
							
							gridContextMenu.showAt(event.getXY());
						},
						render: me.initComponentOnRenderCenterTree,
						scope: me
					}
				},{
					xtype:'panel',
					itemId:'pCenterForm',
					flex:1,
					layout:'fit',
					border:false
				}]
			}]
		});
		
		this.callParent();
		this.initBibleQobjs() ;
		this.syncComponents() ;
		this.mon( me.qobjStore, 'datachanged', this.syncComponents, this ) ;
		this.mon( me.qobjStore, 'update', this.syncComponents, this ) ;
		
		this.setFormpanelRecord(null) ;
	},
	initComponentOnRenderCenterTree: function(tree) {
		var me = this ;
		
		var gridPanelDropTargetEl =  tree.body.dom;

		var gridPanelDropTarget = Ext.create('Ext.dd.DropTarget', gridPanelDropTargetEl, {
			ddGroup: 'QobjToQbookQobjs'+me.getParentId(),
			notifyEnter: function(ddSource, e, data) {
					//Add some flare to invite drop.
					tree.body.stopAnimation();
					tree.body.highlight();
			},
			notifyDrop: function(ddSource, e, data){
				// Reference the record (single selection) for readability
				var selectedRecord = ddSource.dragData.records[0];
				
				if( Ext.getClassName(selectedRecord) != 'QbookBibleQobjTreeModel' ) {
					return false ;
				}
				
				switch( selectedRecord.get('q_type') ) {
					case 'query' :
						var newQobjRecord = Ext.ux.dams.ModelManager.create('QbookQobjModel',{
							qobj_lib: 'New Q object',
							target_q_type: 'query',
							target_query_id: selectedRecord.get('query_id'),
							target_qmerge_id: 0,
							qobj_fields: []
						});
						me.qobjStore.insert(me.qobjStore.getCount(),newQobjRecord) ;
						return true ;
						
					case 'qmerge' :
						var newQobjRecord = Ext.ux.dams.ModelManager.create('QbookQobjModel',{
							qobj_lib: 'New Q object',
							target_q_type: 'qmerge',
							target_query_id: 0,
							target_qmerge_id: selectedRecord.get('qmerge_id'),
							qobj_fields: []
						});
						me.qobjStore.insert(me.qobjStore.getCount(),newQobjRecord) ;
						return true ;
						
					default :
						return false ;
				}
			}
		});
	},
	
	initBibleQobjs: function() {
		var me = this,
			bibleFilesTreefields = me.getQbookPanel().bibleFilesTreefields,
			bibleQobjsStore = me.getQbookPanel().bibleQobjsStore ;
		
		// ***** Arbre de tous query/qmerge (statique) *****
		var queriesTreeChildren = [] ;
		Ext.Array.each( bibleQobjsStore.getRange() , function(queryRecord) {
			var text, icon ;
			switch( queryRecord.get('q_type') ) {
				case 'query' :
					text = queryRecord.get('query_name');
					icon = 'images/op5img/ico_process_16.gif' ;
					break ;
				case 'qmerge' :
					text = queryRecord.get('qmerge_name');
					icon = 'images/op5img/ico_filechild_16.gif' ;
					break ;
			}
			queriesTreeChildren.push({
				text:text,
				q_type:queryRecord.get('q_type'),
				query_id:queryRecord.get('query_id'),
				qmerge_id:queryRecord.get('qmerge_id'),
				icon: icon,
				leaf:true
			}) ;
			
		},me) ;
		me.getComponent('bQueriesTree').getStore().setRootNode({
			root:true,
			text:'Queries',
			children:queriesTreeChildren,
			expanded:true
		});
	},
	
	
	syncComponents: function() {
		var me = this,
			bibleFilesTreefields = me.getQbookPanel().bibleFilesTreefields,
			bibleQobjsStore = me.getQbookPanel().bibleQobjsStore ;
			
		var lookupInputvarById = function( inputvarJsId ) {
			return me.inputvarStore.getById(inputvarJsId) ;
		} ;
		var qobjFieldText = function( fieldName, fieldType, fieldLinkBible, qobjFieldRecords ) {
			var text = '' ;
			if( fieldName ) {
				text += '<u>'+fieldName+'</u>' ;
			} else {
				switch( fieldType ) {
					case 'file' :
						text += '<u>File records</u>' ;
						break ;
					case 'date' :
						text += '<u>Date</u>' ;
						break ;
					case 'string' :
						text += '<u>String</u>' ;
						break ;
					case 'link' :
						text += '<u>Link <b>'+fieldLinkBible+'</b></u>' ;
						break ;
					case 'extrapolate' :
						text += '<u>Extrapolate</u>' ;
						break ;
					case 'number' :
						text += '<u>Number</u>' ;
						break ;
					case 'forcevalue' :
						text += '<u>(debug) Static value</u>' ;
						break ;
				}
			}
			if( qobjFieldRecords == null || qobjFieldRecords.length == 0 ) {
				return text ;
			}
			text += ': ' ;
			var arrTexts = [] ;
			Ext.Array.each( qobjFieldRecords, function(qobjFieldRecord) {
				var inputvarRecord = lookupInputvarById( qobjFieldRecord.get('src_inputvar_jsId') ) ;
				if( inputvarRecord != null ) {
					arrTexts.push(inputvarRecord.get('inputvar_lib')) ;
				}
			},me) ;
			text += arrTexts.join(' / ') ;
			return text ;
		};
		
		// **** Arbre recap des Qobjs et de leur liens *****
		var rootChildren = [] ;
		me.qobjStore.each( function(qobjRecord) {
			var qRecord,
				qobjFields = [] ;
			switch( qobjRecord.get('target_q_type') ) {
				case 'query' :
					qRecord = bibleQobjsStore.getByQueryId(qobjRecord.get('target_query_id')) ;
					qRecord.fields_where().each( function( whereFieldRecord, whereFieldIdx ) {
						var fieldName = bibleFilesTreefields[qRecord.get('target_file_code')].getNodeById(whereFieldRecord.get('field_code')).get('field_text') ;
						var qobjFieldRecords = [] ;
						qobjRecord.qobj_fields().each( function(qobjFieldRecord) {
							if( qobjFieldRecord.get('target_query_wherefield_idx') == whereFieldIdx ) {
								qobjFieldRecords.push(qobjFieldRecord) ;
							}
						},me) ;
						var qobjField = {
							leaf: true,
							icon: (qobjFieldRecords.length > 0 ? 'images/dot_green_16.gif' : 'images/dot_orange_16.gif'),
							text: qobjFieldText(fieldName,whereFieldRecord.get('field_type'),whereFieldRecord.get('field_linkbible'),qobjFieldRecords),
							target_query_wherefield_idx: whereFieldIdx,
							target_qmerge_mwherefield_idx: -1,
							field_type: whereFieldRecord.get('field_type'),
							field_linkbible: whereFieldRecord.get('field_linkbible')
						} ;
						qobjFields.push(qobjField) ;
					},me) ;
					rootChildren.push({
						expanded:true,
						icon: 'images/op5img/ico_process_16.gif',
						text: qRecord.get('query_name') + '&#160;' + '::' + '&#160;' + '<b>' + qobjRecord.get('qobj_lib') + '</b>',
						jsId: qobjRecord.getId(),
						target_q_type: qobjRecord.get('target_q_type'),
						target_query_id: qobjRecord.get('target_query_id'),
						target_qmerge_id: 0,
						children: qobjFields
					}) ;
					break ;
					
				case 'qmerge' :
					qRecord = bibleQobjsStore.getByQmergeId(qobjRecord.get('target_qmerge_id')) ;
					qRecord.fields_mwhere().each( function( mwhereFieldRecord, mwhereFieldIdx ) {
						var qobjFieldRecords = [] ;
						qobjRecord.qobj_fields().each( function(qobjFieldRecord) {
							if( qobjFieldRecord.get('target_qmerge_mwherefield_idx') == mwhereFieldIdx ) {
								qobjFieldRecords.push(qobjFieldRecord) ;
							}
						},me) ;
						var qobjField = {
							leaf: true,
							icon: (qobjFieldRecords.length > 0 ? 'images/dot_green_16.gif' : 'images/dot_orange_16.gif'),
							text: qobjFieldText(null,mwhereFieldRecord.get('mfield_type'),mwhereFieldRecord.get('mfield_linkbible'),qobjFieldRecords),
							target_query_wherefield_idx: -1,
							target_qmerge_mwherefield_idx: mwhereFieldIdx,
							field_type: mwhereFieldRecord.get('mfield_type'),
							field_linkbible: mwhereFieldRecord.get('mfield_linkbible')
						} ;
						qobjFields.push(qobjField) ;
					},me) ;
					rootChildren.push({
						expanded:true,
						icon: 'images/op5img/ico_filechild_16.gif',
						text: qRecord.get('qmerge_name') + '&#160;' + '::' + '&#160;' + '<b>' + qobjRecord.get('qobj_lib') + '</b>',
						jsId: qobjRecord.getId(),
						target_q_type: qobjRecord.get('target_q_type'),
						target_query_id: 0,
						target_qmerge_id: qobjRecord.get('target_qmerge_id'),
						children: qobjFields
					}) ;
					break ;
			}
		},me) ;
		
		me.getComponent('pCenter').getComponent('pCenterTree').getStore().setRootNode({
			root:true,
			text:'<b>Q Items to process</b>',
			children:rootChildren,
			expanded:true
		});
	},
	
	onQobjRename: function( qobjRecord, newLib ) {
		if( newLib != '' ) {
			qobjRecord.set('qobj_lib',newLib) ;
		}
	},
	onQobjMove: function( qobjRecord, offset ) {
		var me = this ,
			qobjStore = me.qobjStore,
			qobjRecordIdx = qobjStore.indexOf(qobjRecord) ;
		
		if( offset == 0 ) {
			return ;
		}
		qobjStore.remove(qobjRecord) ;
		if( offset < 0 ) {
			qobjRecordIdx = Math.max(qobjRecordIdx+offset,0) ;
		} else {
			qobjRecordIdx = Math.min(qobjRecordIdx+offset,qobjStore.getCount()) ;
		}
		qobjStore.insert(qobjRecordIdx,qobjRecord) ;
	},
	onQobjDelete: function( qobjRecord ) {
		var me = this ;
		me.qobjStore.remove(qobjRecord) ;
	},
	
	setFormpanelRecord: function( qbookQobjTreeRecord ){
		var me = this,
			formpanel = me.child('#pCenter').child('#pCenterForm') ;
		formpanel.removeAll() ;
		if( qbookQobjTreeRecord === null ) {
			formpanel.add({
				xtype:'panel',
				border:false,
				frame:true
			});
			return ;
		}
		
		var mform, mformClass ;
		switch( qbookQobjTreeRecord.get('field_type') ) {
			case 'extrapolate' :
				mformClass = 'Optima5.Modules.CrmBase.QbookQprocessFormExtrapolate' ;
				mform = Ext.create(mformClass,{
					frame:true,
					inputvarRecords: me.inputvarStore.getRange(),
					inputvarFieldType: 'date'
				}) ;
				break ;
				
			case 'date' :
				mformClass = 'Optima5.Modules.CrmBase.QbookQprocessFormDate' ;
				mform = Ext.create(mformClass,{
					frame:true,
					inputvarRecords: me.inputvarStore.getRange(),
					inputvarFieldType: 'date'
				}) ;
				break ;
				
			case 'string' :
				mformClass = 'Optima5.Modules.CrmBase.QbookQprocessFormString' ;
				mform = Ext.create(mformClass,{
					frame:true,
					inputvarRecords: me.inputvarStore.getRange(),
					inputvarFieldType: 'string'
				}) ;
				break ;
				
			case 'number' :
				mformClass = 'Optima5.Modules.CrmBase.QbookQprocessFormNumber' ;
				mform = Ext.create(mformClass,{
					frame:true,
					inputvarRecords: me.inputvarStore.getRange(),
					inputvarFieldType: 'number'
				}) ;
				break ;
				
			case 'file' :
				mformClass = 'Optima5.Modules.CrmBase.QbookQprocessFormFile' ;
				mform = Ext.create(mformClass,{
					frame:true,
					inputvarRecords: me.inputvarStore.getRange(),
					inputvarFieldType: 'string'
				}) ;
				break ;
				
			case 'link' :
				mformClass = 'Optima5.Modules.CrmBase.QbookQprocessFormBible';
				mform = Ext.create(mformClass,{
					frame:true,
					inputvarRecords: me.inputvarStore.getRange(),
					inputvarFieldType: 'link',
					inputvarFieldLinkbible: qbookQobjTreeRecord.get('field_linkbible')
				}) ;
				break ;
				
			case 'forcevalue' :
				mformClass = 'Optima5.Modules.CrmBase.QbookQprocessFormForcevalue';
				mform = Ext.create(mformClass,{
					frame:true,
					inputvarRecords: me.inputvarStore.getRange()
				}) ;
				break ;
				
			default :
				mformClass = 'Optima5.Modules.CrmBase.QbookQprocessForm';
				mform = Ext.create(mformClass,{
					frame:true
				}) ;
				break ;
		}
		
		var formValues = {} ;
		var qobjRecord = me.qobjStore.getById( qbookQobjTreeRecord.parentNode.get('jsId') ) ;
		qobjRecord.qobj_fields().each( function(qobjFieldRecord) {
			if( qobjFieldRecord.get('target_qmerge_mwherefield_idx') == qbookQobjTreeRecord.get('target_qmerge_mwherefield_idx')
				&& qobjFieldRecord.get('target_query_wherefield_idx') == qbookQobjTreeRecord.get('target_query_wherefield_idx') ) {
				
				var mkey = qobjFieldRecord.get('target_subfield') ;
				switch( mkey ) {
					case 'condition_bible_treenodes' :
					case 'condition_bible_entries':
						mkey = 'condition_bible' ;
						break ;
					default :
						break ;
				}
				var srcInputvarJsId = qobjFieldRecord.get('src_inputvar_jsId') ;
				formValues[mkey] = srcInputvarJsId ;
			}
		},me) ;
		//console.dir(formValues) ;
		mform.getForm().setValues(formValues) ;
		
		mform.on('change',function(){
			// Delete old values
			var qobjRecord = me.qobjStore.getById( qbookQobjTreeRecord.parentNode.get('jsId') ) ;
			
			var recordsToDelete = [] ;
			qobjRecord.qobj_fields().each( function(qobjFieldRecordTest) {
				if( qobjFieldRecordTest.get('target_qmerge_mwherefield_idx') == qbookQobjTreeRecord.get('target_qmerge_mwherefield_idx')
					&& qobjFieldRecordTest.get('target_query_wherefield_idx') == qbookQobjTreeRecord.get('target_query_wherefield_idx') ) {
				
					// qobjRecord.qobj_fields().remove(qobjFieldRecord) ;
					recordsToDelete.push(qobjFieldRecordTest) ;
				}
			},me) ;
			qobjRecord.qobj_fields().remove(recordsToDelete) ;
			
			var toCopy,
				formValues = mform.getForm().getValues() ;
			switch( qbookQobjTreeRecord.get('field_type') ) {
				case 'forcevalue' :
					toCopy = ['condition_forcevalue_isset','condition_forcevalue_value'] ;
					break ;
				case 'extrapolate' :
					toCopy = ['extrapolate_calc_date_from','extrapolate_calc_date_to','extrapolate_src_date_from'] ;
					break ;
				case 'date' :
					toCopy = ['condition_date_lt','condition_date_gt'] ;
					break ;
				case 'string' :
					toCopy = ['condition_string'] ;
					break ;
				case 'number' :
					toCopy = ['condition_num_lt','condition_num_gt'] ;
					break ;
				case 'file' :
					toCopy = ['condition_file_ids'] ;
					break ;
				case 'link' :
					var srcInputvarJsId = formValues['condition_bible'],
						srcInputvarRecord = me.inputvarStore.getById(srcInputvarJsId) ;
					if( srcInputvarRecord == null ) {
						break ;
					}
					switch( srcInputvarRecord.get('inputvar_linktype') ) {
						case 'treenode' :
							formValues['condition_bible_treenodes'] = srcInputvarJsId ;
							toCopy = ['condition_bible_treenodes'] ;
							break ;
						case 'entry' :
							formValues['condition_bible_entries'] = srcInputvarJsId ;
							toCopy = ['condition_bible_entries'] ;
							break ;
						default :
							break ;
					}
					break ;
				default :
					toCopy = [] ;
					break ;
			}
			var qobjFieldRecords = [] ;
			Ext.Array.each( toCopy , function(toCopyVar) {
				if( formValues[toCopyVar] == null || formValues[toCopyVar]=='' ) {
					qobjFieldRecords = [] ;
					return false ;
				}
				
				qobjFieldRecords.push( Ext.create('QbookQobjFieldModel',{
					target_query_wherefield_idx: qbookQobjTreeRecord.get('target_query_wherefield_idx'),
					target_qmerge_mwherefield_idx: qbookQobjTreeRecord.get('target_qmerge_mwherefield_idx'),
					target_subfield: toCopyVar,
					field_type: qbookQobjTreeRecord.get('field_type'),
					field_linkbible: qbookQobjTreeRecord.get('field_linkbible'),
					src_inputvar_jsId: formValues[toCopyVar]
				})) ;
			},me) ;
			qobjRecord.qobj_fields().insert(0,qobjFieldRecords) ;
			qobjRecord.commit() ;
		},me) ;
		
		formpanel.add( mform ) ;
	}
}) ;