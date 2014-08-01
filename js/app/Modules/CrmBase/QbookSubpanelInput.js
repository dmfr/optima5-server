Ext.define('Optima5.Modules.CrmBase.QbookSubpanelInput' ,{
	extend: 'Optima5.Modules.CrmBase.QbookSubpanel',
			  
	alias: 'widget.op5crmbaseqbookinput',
	
	requires: [
		'Optima5.Modules.CrmBase.QbookInputvarFormDate'
	],
	
	inputvarStore : null ,
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items:[{
				xtype: 'treepanel',
				itemId: 'pFieldsTree',
				flex: 1,
				border:false,
				useArrows: true,
				rootVisible: false,
				tbar:[{
					itemId: 'btn-files',
					text: 'No file selected',
					//textCaption: '',
					iconCls: 'op5-crmbase-waitcircle',
					menu: []
				},{
					itemId: 'box-filerecordtxt',
					xtype:'box',
					cls: 'op5-crmbase-qbook-srcfilerecord-box',
					html: '&#160;'
				}],
				store: {
					model: 'QueryFieldsTreeModel',
					nodeParam: 'field_code',
					root: {children:[]},
					proxy: {
						type: 'memory' ,
						reader: {
								type: 'json'
						}
					}
				},
				columns: [{
					xtype: 'treecolumn', //this is so we know which column will show the tree
					text: 'Task',
					flex: 2,
					sortable: false,
					dataIndex: 'field_text',
					menuDisabled: true
				},{
					text: 'Assigned To',
					flex: 1,
					sortable: false,
					dataIndex: 'field_type_text',
					menuDisabled: true
				}],
				viewConfig: {
						plugins: {
							ptype: 'treeviewdragdrop',
							enableDrag: true,
							enableDrop: false,
							ddGroup: 'TreeToGrids'+me.getParentId()
						}
				}
			},{
				xtype:'grid',
				itemId:'pGrid',
				title:'Source variables',
				flex: 1,
				store: me.inputvarStore ,
				sortableColumns: false ,
				columns: [{
					header: 'Var name',
					menuDisabled: true ,
					flex:1,
					dataIndex: 'inputvar_lib',
					editor:{xtype:'textfield'}
				},{
					header: 'Source',
					menuDisabled: true ,
					flex:1 ,
					renderer: function( value, metaData, record ) {
						var text = '' ;
						if( record.get('src_backend_is_on') ) {
							var fieldCode = [record.get('src_backend_file_code'),record.get('src_backend_file_field_code')].join('_field_'),
								treeRecord = me.child('#pFieldsTree').getStore().getNodeById(fieldCode),
								fieldText = (treeRecord != null ? treeRecord.get('field_text') : fieldCode ) ;
							text += fieldText ;
							if( !Ext.isEmpty(record.get('src_backend_bible_type')) && !Ext.isEmpty(record.get('src_backend_bible_field_code')) ) {
								fieldCode += '_' + record.get('src_backend_bible_type') + '_' + record.get('src_backend_bible_field_code') ;
								treeRecord = me.child('#pFieldsTree').getStore().getNodeById(fieldCode) ;
								if( treeRecord ) {
									text += ' :: ' + treeRecord.get('field_text') ;
								} else {
									text += ' :: ' + '???' ;
								}
							}
						} else if( record.get('inputvar_type') == 'date' ) {
							text += '<i>Current date</i>' ;
						}
						
						if( record.get('inputvar_type') == 'date' ) {
							if( record.get('date_align_is_on') ) {
								text += '&#160;'+'<font color="red">+ align</font>' ;
							}
							if( record.get('date_calc_is_on') ) {
								text += '&#160;'+'<font color="red">+ calc</font>' ;
							}
						}
						
						return text ;
					}
				}],
				plugins: [{
					ptype: 'rowediting'
				}],
				listeners: {
					render: me.onGridRender,
					drop: function(){
						me.inputvarStore.sync() ;
					},
					itemclick: function( view, record, item, index, event ) {
						me.setFormpanelRecord( record ) ;
					},
					itemcontextmenu: function(view, record, item, index, event) {
						// var strHeader = record.get('treenode_key')+' - '+record.get('entry_key')
						gridContextMenuItems = new Array() ;
						if( true ) {
							gridContextMenuItems.push({
								iconCls: 'icon-bible-delete',
								text: 'Delete condition',
								handler : function() {
									me.setFormpanelRecord(null) ;
									me.inputvarStore.remove(record) ;
								},
								scope : me
							});
						}
						
						var gridContextMenu = Ext.create('Ext.menu.Menu',{
							items : gridContextMenuItems,
							listeners: {
								hide: function(menu) {
									menu.destroy() ;
								}
							}
						}) ;
						
						gridContextMenu.showAt(event.getXY());
					},
					scope: me
				},
				viewConfig: {
					plugins: {
						ptype: 'gridviewdragdrop',
						ddGroup: 'QbookInputvarReorder'+me.getParentId()
					}
				}
			},{
				xtype:'panel',
				itemId:'pForm',
				flex:1,
				layout:'fit',
				border:false
			}]
		}) ;
		
		// Bind events to parent panel
		me.mon( me.getQbookPanel(), 'backendfilerecordchange', me.onPickBackendFilerecord, me );
		
		me.callParent() ;
		me.initFiles() ;
		me.setFormpanelRecord(null) ;
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
						case 'string' :
						case 'link' :
						case 'date' :
						case 'number' :
						case 'bool' :
							if( selectedRecord.get('bible_field_code') != '' ) {
								//subfield of a bible ! DONE: implement support
							}
							break ;
						
						default :
							return false ;
					}
					
					var newRecord = Ext.create('QbookInputvarModel',{
						inputvar_lib:'New variable',
						inputvar_type:selectedRecord.get('field_type'),
						inputvar_linktype: selectedRecord.get('field_linktype'),
						inputvar_linkbible: selectedRecord.get('field_linkbible'),
						src_backend_is_on: true,
						src_backend_file_code: selectedRecord.get('file_code'),
						src_backend_file_field_code: selectedRecord.get('file_field_code'),
						src_backend_bible_type: selectedRecord.get('bible_type'),
						src_backend_bible_field_code: selectedRecord.get('bible_field_code')
					}) ;
					
					me.inputvarStore.insert( me.inputvarStore.getCount(), newRecord );

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
	
	
	initFiles: function() {
		var me = this ;
		
		var ajaxConnection = me.getQbookPanel().optimaModule.getConfiguredAjaxConnection() ;
		ajaxConnection.request({
			params: {
				_action : 'define_getMainToolbar',
				data_type : 'file'
			},
			success: me.onLoadFiles,
			scope: me
		});
	},
	onLoadFiles: function( response ) {
		var me = this,
			respObj = Ext.decode(response.responseText) ;
		
		var btnFiles = me.child('#pFieldsTree').child('toolbar').child('#btn-files') ;
		
		var menuCfg = respObj.data_files ;
		Ext.Array.each( menuCfg, function(o) {
			Ext.apply(o,{
				handler: function() {
					me.onSelectBackendFile( o.fileId, false ) ;
				},
				scope:me
			}) ;
		},me) ;
		
		if( btnFiles.menu ) {
			btnFiles.menu.removeAll() ;
			btnFiles.menu.add(menuCfg) ;
		}
		btnFiles.setIconCls('') ;
		btnFiles.setIcon('images/op5img/ico_dataadd_16.gif') ;
		/*
		btnFiles.setObjText({
			title: btnFiles.getObjText().title,
			redcount: menuCfg.length,
			caption: me.getHeadlines(menuCfg)
		});
		*/
		
		if( me.backendFileCode ) {
			me.onSelectBackendFile(me.backendFileCode,true) ;
		}
	},
	onSelectBackendFile: function( backendFileCode, doSilent ) {
		var me = this,
			pFieldsTree = me.child('#pFieldsTree'),
			btnFiles = pFieldsTree.child('toolbar').child('#btn-files') ;
			
		if( !doSilent ) {
			if( me.backendFileCode != null  &&  me.inputvarStore.getCount() > 0  &&  me.backendFileCode != backendFileCode ) {
				Ext.Msg.alert('Cannot switch file', 'Variables are already defined. Cannot change backend !');
				return ;
			}
		}
			
		btnFiles.menu.items.each( function(item) {
			if( item.fileId == backendFileCode ) {
				btnFiles.setIcon( item.icon ) ;
				btnFiles.setText( item.text ) ;
				return false ;
			}
		},me) ;
		
		if( me.getQbookPanel().bibleFilesTreefields[backendFileCode] ) {
			pFieldsTree.getStore().setRootNode(me.getQbookPanel().bibleFilesTreefields[backendFileCode].getRootNode().copy(undefined,true)) ;
			me.child('#pGrid').getView().refresh() ; // Needed to render field Descs properly
		} else {
			pFieldsTree.setRootNode({children:[]}) ;
		}
		
		me.backendFileCode = backendFileCode ;
		if( !doSilent ) {
			me.fireEvent('selectbackendfile',backendFileCode) ;
		}
	},
	onPickBackendFilerecord: function( fileCode, filerecordId ) {
		var me = this,
			filerecordTxtBox = me.getComponent('pFieldsTree').child('toolbar').child('#box-filerecordtxt') ;
		
		if( filerecordId == null ) {
			filerecordTxtBox.update('&#160;') ;
			return ;
		}
		
		if( me.backendFileCode != fileCode ) {
			filerecordTxtBox.update('WARN !') ;
			return ;
		}
		
		filerecordTxtBox.update('# '+filerecordId) ;
	},
	
	
	setFormpanelRecord: function( record ){
		var me = this,
			formpanel = me.child('#pForm') ;
		formpanel.removeAll() ;
		if( record === null ) {
			formpanel.add({
				xtype:'panel',
				border:false,
				frame:true
			});
			return ;
		}
		
		var mform ;
		switch( record.get('inputvar_type') ) {
			case 'date' :
				mform = Ext.create('Optima5.Modules.CrmBase.QbookInputvarFormDate',{
					frame:true
				}) ;
				break ;
				
			default :
				mform = Ext.create('Optima5.Modules.CrmBase.QbookInputvarForm',{
					frame:true
				}) ;
				break ;
		}
		mform.loadRecord(record) ;
		
		mform.on('change',function(){
			Ext.Object.each( mform.getForm().getValues() , function(k,v){
				switch( k ) {
					case 'date_align_is_on' :
					case 'date_align_segment_type' :
					case 'date_align_direction_end' :
					case 'date_calc_is_on' :
					case 'date_calc_segment_type' :
					case 'date_calc_segment_count' :
						
						break ;
						
					default :
						return ;
				}
				record.set(k,v) ;
			},me) ;
		},me) ;
		
		formpanel.add( mform ) ;
	}
}) ;