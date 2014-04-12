Ext.define('QmergeMselectGrouptagTreeModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'id',  type: 'int'},
		{name: 'text', type:'string'},
		{name: 'display_geometry',  type: 'string'}
	]
});

Ext.define('Optima5.Modules.CrmBase.QmergeSubpanelMselect' ,{
	extend: 'Optima5.Modules.CrmBase.QmergeSubpanel',
			  
	alias: 'widget.op5crmbaseqmergemselect',
			  
	qmergeGrouptagObj: null,
	mselectStore : null ,
			  
	initComponent: function() {
		var me = this ;
		
		Ext.apply( me, {
			title: 'M-Query target results' ,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			autoDestroy: true ,
			items: [ Ext.apply(me.initComponentCreateGrid(),{
				flex:1 
			}),Ext.apply(me.initComponentCreateFormulaPanel(),{
				flex:1 
			})]
		}) ;
		
		me.callParent() ;
		
		me.setFormulaRecord(null) ;
	},
	initComponentCreateGrid: function() {
		var me = this ;
		
		var rowEditing = Ext.create('Ext.grid.plugin.RowEditing') ;
		rowEditing.on('canceledit', function() {
			var records = store.getRange();
			for (var i = 0; i < records.length; i++) {
				if( records[i].validate().getCount() > 0 )
					store.remove(records[i]) ;
			}
		},me) ;
		
		
		var grid = Ext.create('Ext.grid.Panel',{
			plugins: [rowEditing],
			store: me.mselectStore ,
			sortableColumns: false ,
			columns: [
				{ menuDisabled: true , header: 'Field Code',  dataIndex: 'select_lib' , flex:1, editor:{xtype:'textfield'}  }
			],
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'left',
				items: [{
					iconCls: 'icon-add',
					handler: function(){
						var newRecordIndex = me.mselectStore.getCount() ;
						
						me.mselectStore.insert(newRecordIndex, Ext.create('QmergeMselectModel'));
						grid.getView().getSelectionModel().select(newRecordIndex) ;
						rowEditing.startEdit(newRecordIndex, 0);
					},
					scope: me
				}, '-', {
					itemId: 'delete',
					iconCls: 'icon-delete',
					disabled: true,
					handler: function(){
						var selection = grid.getView().getSelectionModel().getSelection()[0];
						if (selection) {
							me.mselectStore.remove(selection);
						}
					},
					scope: me
				}]
			}],
			viewConfig: {
				plugins: {
					ptype: 'gridviewdragdrop',
					ddGroup: 'qmergemselectreorder'+me.getParentId()
				}
			}
		}) ;
		
		grid.getSelectionModel().on('selectionchange', function(selModel, selections){
			grid.down('#delete').setDisabled(selections.length === 0);
			me.setFormulaRecord( selections[0] ) ;
		},me);
		
		return grid ;
	},
	initComponentCreateFormulaPanel: function(){
		var me = this ;
		
		me.formulapanel = Ext.create('Ext.panel.Panel',{
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border:false
		}) ;
		
		return me.formulapanel ;
	},
			  
			  
	
	setFormulaRecord: function( editedrecord ){
		var me = this ;
		me.formulapanel.removeAll() ;
		if( typeof editedrecord === 'undefined' || editedrecord === null ) {
			me.formulapanel.add({
				xtype:'panel',
				border:false,
				frame:true,
				flex:1
			});
			return ;
		}
		
		/*
		***************************************
			qmergeGrouptagObj > Axis Detach
		**************************************
		*/
		var mselectAxisdetachStore = editedrecord.axis_detach() ;
		var axisDetached = [] ;
		Ext.Array.each( mselectAxisdetachStore.getRange(), function(rec) {
			if( rec.get('axis_is_detach') == true ) {
				axisDetached.push(rec.get('display_geometry')) ;
			}
		},me) ;
		
		
		var nodeId = 0;
		var grouptabTreeChildren = [] ;
		Ext.Object.each( me.qmergeGrouptagObj, function(k,v) {
			var grouptabTreeSubnodes = [] ;
			Ext.Object.each( v , function(sk,sv) {
				var text = 'UNKNOWN' ;
				var grouptagSegments = sk.split('%') ;
				switch( grouptagSegments[0] ) {
					case 'BIBLE' :
						text = '<u>Link</u>'+' <b>'+grouptagSegments[1]+'</b>' ;
						break ;
						
					case 'DATE' :
						text = '<u>Date</u>'+' ('+grouptagSegments[1]+')' ;
						break ;
					
					case 'FILE' :
						text = '<u>File</u>'+' ('+grouptagSegments[1]+')' ;
						break ;
				}
				
				nodeId++ ;
				grouptabTreeSubnodes.push({
					id:nodeId ,
					text:text,
					leaf:true
				}) ;
			},me) ;
			
			nodeId++ ;
			var text,display_geometry ;
			switch( k ) {
				case 'tab' :
					text = '<b>'+'Worksheet Tabs'+'</b>' ;
					display_geometry = 'tab' ;
					break ;
				case 'grid_y' :
					text = '<b>'+'Grid Y'+'</b>' ;
					display_geometry = 'grid-y' ;
					break ;
				case 'grid_x' :
					text = '<b>'+'Grid X'+'</b>' ;
					display_geometry = 'grid-x' ;
					break ;
					
				default : return ;
			}
			
			grouptabTreeChildren.push({
				id: nodeId,
				text: text,
				display_geometry: display_geometry,
				checked:!(Ext.Array.contains(axisDetached,display_geometry)),
				expanded:true,
				children:grouptabTreeSubnodes
			});
			
		},me) ;
		nodeId++ ;
		var grouptabTreeRoot = {
			root:true,
			id:nodeId,
			text:'Query Parameters',
			children:grouptabTreeChildren,
			expanded:true
		}
		
		var grouptabTreeOnCheckchange = function(){
			var mselectAxisdetachStore = editedrecord.axis_detach() ;
			var mselectAxisdetachStoreRecId = -1 ;
			mselectAxisdetachStore.removeAll() ;
			grouptagTree.getStore().getRootNode().cascadeBy( function(rec) {
				if( rec.get('checked') === null ) {
					return true ;
				}
				if( rec.get('display_geometry') == 'tab' ) {
					rec.set('checked',true) ;
				}
				mselectAxisdetachStoreRecId++ ;
				mselectAxisdetachStore.insert(mselectAxisdetachStoreRecId,Ext.create('QmergeMselectAxisdetachModel',{
					display_geometry:rec.get('display_geometry'),
					axis_is_detach:!(rec.get('checked'))
				})) ;
				return false ;
			},me) ;
		}
		
		var grouptagTree = Ext.create('Ext.tree.Panel',{
			title:'Attach to Axis',
			itemId: 'mqueryMwhereTree',
			flex: 2,
			useArrows: true,
			rootVisible: false,
			store: {
				model: 'QmergeMselectGrouptagTreeModel',
				nodeParam: 'id',
				root: grouptabTreeRoot
			},
			viewConfig: {
				listeners: {
					checkchange: grouptabTreeOnCheckchange,
					scope:me
				}
			}
		}) ;
		
		grouptabTreeOnCheckchange.call(me) ;
		
		
		/*
		****************************************
			FormulaStore + FormulaGrid
		**************************************
		*/
		var formulaStore = editedrecord.math_expression() ;
		
		var formulaGrid = Ext.create('Ext.grid.Panel',{
			flex:3,
			sortableColumns: false ,
			plugins: [Ext.create('Ext.grid.plugin.RowEditing')] ,
			store : formulaStore ,
			columns: [{
				menuDisabled: true ,
				header: 'Math' ,
				dataIndex: 'math_operation',
				width: 40 ,
				editor : {
					xtype: 'combobox',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['math_operation','lib'],
						data : [
							{math_operation:'', lib:'no'},
							{math_operation:'+', lib:'+'},
							{math_operation:'-', lib:'-'},
							{math_operation:'*', lib:'X'},
							{math_operation:'/', lib:'/'},
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'math_operation'
				},
				renderer: function( value ) {
					if( value != null && value.length > 0 ) {
						return '<b>'+value+'</b>' ;
					}
					return '' ;
				}
			},{
				menuDisabled: true ,
				header: '[<b>(</b>]' ,
				dataIndex: 'math_parenthese_in',
				width:24,
				editor:{
					xtype:'checkbox'
				},
				renderer: function( value ) {
					if( value === true ) {
						return '<b>(</b>' ;
					}
					return '' ;
				}
			},{
				menuDisabled: true ,
				header: 'Field/Value' ,
				//dataIndex: 'math_fieldoperand',
				flex:1 ,
				renderer: function( value, metaData, record ) {
					if( record.get('math_staticvalue') > 0 ) {
						return 'STATIC(<u>'+record.get('math_staticvalue')+'</u>)' ;
					}
					
					var queryId = record.get('math_operand_query_id') ;
					var queryWherefieldIdx = record.get('math_operand_selectfield_idx') ;
					
					var strVal = me.getQmergePanel().bibleQueriesStore.getById(queryId).fields_select().getAt(queryWherefieldIdx).get('select_lib') ;
					
					return strVal ;
				}
			},{
				menuDisabled: true ,
				header: '[<b>)</b>]' ,
				dataIndex: 'math_parenthese_out',
				width:24,
				editor:{
					xtype:'checkbox'
				},
				renderer: function( value ) {
					if( value === true ) {
						return '<b>)</b>' ;
					}
					return '' ;
				}
			}],
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'top',
				items: [{
					xtype: 'combobox',
					name: 'math_func_mode',
					width: 60,
					value: editedrecord.get('math_func_mode'),
					forceSelection: true,
					editable: false,
					store: {
						fields: ['math_func_mode','lib'],
						data : [
							{math_func_mode:'OUT', lib:'outer'},
							{math_func_mode:'IN', lib:'inner'}
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'math_func_mode',
					listeners: {
						change: function( mcombo, newValue ) {
							editedrecord.set('math_func_mode',newValue) ;
						},
						scope:me
					}
				},{
					xtype: 'combobox',
					name: 'math_func_group',
					width: 60,
					value: editedrecord.get('math_func_group'),
					forceSelection: true,
					editable: false,
					store: {
						fields: ['math_func_group','lib'],
						data : [
							{math_func_group:'AVG', lib:'AVG'},
							{math_func_group:'SUM', lib:'SUM'},
							{math_func_group:'MIN', lib:'MIN'},
							{math_func_group:'MAX', lib:'MAX'}
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'math_func_group',
					listeners: {
						change: function( mcombo, newValue ) {
							editedrecord.set('math_func_group',newValue) ;
						},
						scope:me
					}
				},{
					xtype:'label',
					width:10
				},{
					xtype:'label',
					text: 'R/d: '
				},{
					xtype: 'numberfield',
					name: 'math_round',
					width:35,
					value: editedrecord.get('math_round'),
					valueField: 'math_round',
					listeners: {
						change: function( mcombo, newValue ) {
							editedrecord.set('math_round',newValue) ;
						},
						scope:me
					}
				},'->',{
					itemId: 'addStatic',
					iconCls: 'icon-add',
					menu: {
						xtype:'menu' ,
						title: 'User options',
						items:[{
							xtype:'textfield' ,
							allowBlank: false,
							regex: /^[0-9]\d*(\.\d+)?$/ ,
							width:50
						},{
							xtype:'button',
							text:'Add value',
							handler: function(button){
								var textfield = button.up().query('textfield')[0] ;
								if( textfield.isValid() ) {
									var newRecord = Ext.create('QmergeMselectFormulasymbolModel',{
										math_staticvalue:textfield.getValue()
									}) ;
									formulaGrid.getStore().insert( formulaGrid.getStore().count(), newRecord );
									
									Ext.menu.Manager.hideAll();
								}
							},
							scope:me
						}]
					}
				},{
					itemId: 'delete',
					iconCls: 'icon-delete',
					disabled: true,
					handler: function(){
						var selection = formulaGrid.getView().getSelectionModel().getSelection()[0];
						if (selection) {
							formulaStore.remove(selection);
						}
					},
					scope: me
					
				}]
			}],
			listeners: {
				render: me.setFormulaRecordOnGridRender,
				scope:me
			},
			viewConfig: {
					listeners: {
						drop: function(){
						},
						scope: me
					},
					plugins: {
						ptype: 'gridviewdragdrop',
						ddGroup: 'queryselectreorder'+me.getParentId()
					}
			}
		}) ;
		formulaGrid.getSelectionModel().on('selectionchange', function(selModel, selections){
			formulaGrid.down('#delete').setDisabled(selections.length === 0);
		},me);
		
		me.formulapanel.add([grouptagTree,formulaGrid]) ;
	},
	setFormulaRecordOnGridRender: function(grid) {
		var me = this ;
		
		var gridPanelDropTargetEl =  grid.body.dom;

		var gridPanelDropTarget = Ext.create('Ext.dd.DropTarget', gridPanelDropTargetEl, {
			ddGroup: 'MqueriesToMpanels'+me.getParentId(),
			notifyEnter: function(ddSource, e, data) {
					//Add some flare to invite drop.
					grid.body.stopAnimation();
					grid.body.highlight();
			},
			notifyDrop: function(ddSource, e, data){
					// Reference the record (single selection) for readability
					var selectedRecord = ddSource.dragData.records[0];
					
					if( Ext.getClassName(selectedRecord) != 'QmergeItemsTreeModel' ) {
						return false ;
					}
					if( selectedRecord.get('query_field_type') != 'select' || selectedRecord.parentNode == null ) {
						return false ;
					}
					
					var queryId = selectedRecord.parentNode.get('query_id') ;
					var queryWherefieldIdx = selectedRecord.get('query_field_idx') ;
					
					var newRecord = Ext.create('QmergeMselectFormulasymbolModel',{
						math_operand_query_id:queryId ,
						math_operand_selectfield_idx:queryWherefieldIdx
					}) ;
					
					grid.getStore().insert( grid.getStore().count(), newRecord );
					return true;
			}
		});
	},

	syncGrid: function() {
		
	}
			  
			  
}) ;