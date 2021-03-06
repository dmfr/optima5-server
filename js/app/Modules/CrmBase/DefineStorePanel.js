Ext.define('Optima5.Modules.CrmBase.DefineStoreTagsField',{
	extend: 'Ext.form.FieldContainer',
	
	mixins: [
		'Ext.form.field.Base'
	],
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			layout: {
				type: 'hbox',
				align: 'center'
			},
			items: [{
				itemId: 'cmbAdd',
				xtype: 'combobox',
				width: 100,
				forceSelection: false,
				editable: true,
				queryMode: 'local',
				displayField: 'tag',
				valueField: 'tag',
				store: {
					data: [],
					fields: [{name:'tag', type:'string'}],
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					}
				}
			},{
				itemId: 'btnAdd',
				xtype: 'button',
				iconCls: 'op5-crmbase-definestoretags-btn',
				margin: {
					left: 4,
					right: 8
				},
				handler: function() {
					this.handleAdd() ;
				},
				scope: this
			},{
				itemId: 'dvTags',
				xtype: 'dataview',
				cls: 'op5-crmbase-definestoretags-field',
				tpl: [
					'<tpl for=".">',
						'<div class="op5-crmbase-definestoretags">',
							'<div class="op5-crmbase-definestoretags-icodelete">',
							'</div>',
							'<div class="op5-crmbase-definestoretags-text">',
							'{tag}',
							'</div>',
						'</div>',
					'</tpl>'
				],
				itemSelector: 'div.op5-crmbase-definestoretags',
				store: {
					data: [],
					fields: [{name:'tag', type:'string'}],
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					}
				},
				prepareData: function(data) {
					return data;
				},
				listeners: {
					itemclick: function(dv, record, item, index, e, eOpts) {
						if( e.getTarget('div.op5-crmbase-definestoretags-icodelete') ) {
							this.deleteTag(record) ;
						}
					},
					scope: this
					
				}
			}]
		}) ;
		me.mixins.field.constructor.call(me);
		
		me.callParent() ;
	},
	getStore: function() {
		return this.down('#dvTags').getStore() ;
	},
	getRawValue: function() {
		var values = [] ;
		this.getStore().each( function(rec) {
			values.push(rec.get('tag')) ;
		}) ;
		return Ext.JSON.encode(values) ;
	},
	getValue: function() {
		var values = [] ;
		this.getStore().each( function(rec) {
			values.push(rec.get('tag')) ;
		}) ;
		return values ;
	},
	setRawValue: function(jsonValues) {
		if( Ext.isEmpty(jsonValues) ) {
			this.getStore().removeAll() ;
		}
		var values = Ext.JSON.decode( jsonValues ),
			data = [] ;
		Ext.Array.each( values, function(tag) {
			data.push({tag:tag}) ;
		}) ;
		this.getStore().loadData(data) ;
	},
	setValue: function(values) {
		if( Ext.isEmpty(values) ) {
			this.getStore().removeAll() ;
		}
		var data = [] ;
		Ext.Array.each( values, function(tag) {
			data.push({tag:tag}) ;
		}) ;
		this.getStore().loadData(data) ;
	},
	handleAdd: function() {
		var cmbAdd = this.down('#cmbAdd'),
			dvTags = this.down('#dvTags') ; 
		if( Ext.isEmpty(cmbAdd.getValue()) ) {
			return ;
		}
		dvTags.getStore().insert(0,{
			tag: cmbAdd.getValue().trim()
		});
		cmbAdd.reset() ;
	},
	deleteTag: function(tagRecord) {
		this.down('#dvTags').getStore().remove(tagRecord) ;
	}
});


Ext.define('Optima5.Modules.CrmBase.DefineStorePanel' ,{
	extend: 'Ext.panel.Panel',
	
	requires : [
		'Ext.ux.dams.EmbeddedGrid',
		'Ext.ux.dams.EmbeddedButton',
		'Optima5.Modules.CrmBase.DefineStoreCalendarForm',
		'Optima5.Modules.CrmBase.DefineStoreFieldJoinPanel',
		'Optima5.Modules.CrmBase.DefineStoreLinkbibleField',
		'Ext.ux.dams.ComboBoxCached'
	],
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:DefineStorePanel','No module reference ?') ;
		}
		
		// Creation du layout : form + tabpanel(restful grid X 2) 
		// Envoi AJAX pour ouvrir la session => success on redirige vers initLoadEverything
		
		
		this.treeFieldType = Ext.create('Ext.data.Store', {
			fields: ['dataType', 'dataTypeLib'],
			data : [
				{"dataType":"string", "dataTypeLib":"String"},
				{"dataType":"stringplus", "dataTypeLib":"Text"},
				{"dataType":"number", "dataTypeLib":"Number"},
				{"dataType":"bool", "dataTypeLib":"Boolean"},
				{"dataType":"extid", "dataTypeLib":"Ext.ID"},
				{"dataType":"date", "dataTypeLib":"Date"}
			]
		});
		this.entryFieldType = Ext.create('Ext.data.Store', {
			fields: ['dataType', 'dataTypeLib'],
			data : [
				{"dataType":"_label", "dataTypeLib":"None/Label"},
				{"dataType":"string", "dataTypeLib":"String"},
				{"dataType":"stringplus", "dataTypeLib":"Text"},
				{"dataType":"number", "dataTypeLib":"Number"},
				{"dataType":"bool", "dataTypeLib":"Boolean"},
				{"dataType":"extid", "dataTypeLib":"Ext.ID"},
				{"dataType":"date", "dataTypeLib":"Date"}
			]
		});
		this.tableFieldType = Ext.create('Ext.data.Store', {
			fields: ['dataType', 'dataTypeLib'],
			data : [
				{"dataType":"_label", "dataTypeLib":"None/Label"},
				{"dataType":"string", "dataTypeLib":"String"},
				{"dataType":"stringplus", "dataTypeLib":"Text"},
				{"dataType":"number", "dataTypeLib":"Number"},
				{"dataType":"bool", "dataTypeLib":"Boolean"},
				{"dataType":"extid", "dataTypeLib":"Ext.ID"},
				{"dataType":"date", "dataTypeLib":"Date"}
			]
		});
		
		this.parentFiles = Ext.create('Ext.data.Store', {
			fields: ['fileCode', 'fileLib'],
			data : []
		});
		
		this.linkBibles = Ext.create('Ext.data.Store', {
			fields: ['bibleCode', 'bibleLib'],
			data: []
		}) ;
		this.linkBibles.on('load',function() { // Hack to force renderer to catch bibles Libs
			var tabpanel = me.down('tabpanel'),
				treetab = ( tabpanel != null ? tabpanel.child('#treetab') : null ),
				elementtab = ( tabpanel != null ? tabpanel.child('#elementtab') : null ) ;
			if( treetab ) {
				treetab.getView().refresh() ;
			}
			if( elementtab ) {
				elementtab.getView().refresh() ;
			}
		},me) ;
		
		this.linktypesForBible = Ext.create('Ext.data.Store', {
			fields: ['linktypeCode', 'linktypeLib','linktypeIconCls'],
			data:[
				{linktypeCode:'treenode',linktypeLib:'Treenode',linktypeIconCls:'op5-crmbase-definelink-type-treenode'}
			]
		}) ;
		this.linktypesForFile = Ext.create('Ext.data.Store', {
			fields: ['linktypeCode', 'linktypeLib','linktypeIconCls'],
			data:[
				{linktypeCode:'entry',linktypeLib:'Entry',linktypeIconCls:'op5-crmbase-definelink-type-entry'},
				{linktypeCode:'treenode',linktypeLib:'Treenode',linktypeIconCls:'op5-crmbase-definelink-type-treenode'}
			]
		}) ;
		
		
		me.fieldTypeRenderer = function( value, metaData, record, gridType ) {
			var fieldTypeColumnKey, fieldLinktypeColumnKey, fieldLinkbibleColumnKey, fieldTypesStore ;
			switch( gridType ) {
				case 'tree' :
					fieldTypeColumnKey = 'tree_field_type' ;
					fieldLinktypeColumnKey = 'tree_field_linktype' ;
					fieldLinkbibleColumnKey = 'tree_field_linkbible' ;
					fieldTypesStore = this.treeFieldType ;
					break ;
				case 'entry' :
					fieldTypeColumnKey = 'entry_field_type' ;
					fieldLinktypeColumnKey = 'entry_field_linktype' ;
					fieldLinkbibleColumnKey = 'entry_field_linkbible' ;
					fieldTypesStore = this.entryFieldType ;
					break ;
				case 'table' :
					fieldTypeColumnKey = 'table_field_type' ;
					fieldTypesStore = this.tableFieldType ;
					break ;
				default :
					return value ;
					break ;
			}
			
			switch( record.get(fieldTypeColumnKey) ) {
				case 'join' :
					value = '<b>'+'Table Join'+'</b>' ;
					break ;
					
				case 'link' :
					value = '<b>'+'Link:'+'</b>'+'&#160;' ;
					switch( record.get(fieldLinktypeColumnKey) ) {
						case 'treenode' :
							value += '(TreeNode)'+'&#160;' ;
							break ;
						case 'entry' :
							value += '(Entry)'+'&#160;' ;
							break ;
						default :
							break ;
					}
					var bibleCode = record.get(fieldLinkbibleColumnKey),
						bibleRecord = me.linkBibles.findRecord('bibleCode',bibleCode) ;
					if( bibleRecord != null ) {
						value += bibleRecord.get('bibleLib') ;
					} else {
						value += bibleCode ;
					}
					break ;
					
				default :
					var fieldType = record.get(fieldTypeColumnKey),
						fieldTypeRecord = fieldTypesStore.findRecord('dataType',fieldType) ;
					if( fieldTypeRecord != null ) {
						value = '<b>'+'type:'+'</b>'+'&#160;'+fieldTypeRecord.get('dataTypeLib') ;
					}
			}
			return value ;
		}
		var treeFieldTypeRenderer = function( value, metaData, record, rowIndex, colIndex, store, view ) {
			return me.fieldTypeRenderer( value, metaData, record, 'tree' ) ;
		}
		var entryFieldTypeRenderer = function( value, metaData, record, rowIndex, colIndex, store, view ) {
			return me.fieldTypeRenderer( value, metaData, record, 'entry' ) ;
		}
		var tableFieldTypeRenderer = function( value, metaData, record, rowIndex, colIndex, store, view ) {
			return me.fieldTypeRenderer( value, metaData, record, 'table' ) ;
		}
		
		var tabitems = new Array() ;
		var calendartab = Ext.create( 'Optima5.Modules.CrmBase.DefineStoreCalendarForm', {
			optimaModule: me.optimaModule,
			title:'Calendar Cfg',
			itemId:'calendartab',
			frame: true,
			hidden: true ,
			bodyPadding: 5,
			listeners: {
				beforeshow:function(){
					var fieldsTab = [] ;
					Ext.Array.each( this.query('> tabpanel')[0].child('#elementtab').linkstore.getRange(), function(rec){
						fieldsTab.push({
							field_code: rec.get('entry_field_code'),
							field_desc: rec.get('entry_field_code')+': '+rec.get('entry_field_lib'),
							field_type: rec.get('entry_field_type'),
							field_linktype: rec.get('entry_field_linktype'),
							field_linkbible: rec.get('entry_field_linkbible')
						});
					});
					this.query('> tabpanel')[0].child('#calendartab').loadCurrentlyDefinedFields(fieldsTab) ;
				},
				scope: me
			}
		}) ;
		var treetab = new Object() ;
		Ext.apply( treetab, {
			title:'TreeStructure',
			itemId:'treetab',
			xtype:'damsembeddedgrid',
			columns: {
				defaults: {
					menuDisabled: true,
					draggable: false,
					sortable: false
				},
				items: [{
					text: 'Node Code',
					// width: 40,
					width:140,
					dataIndex: 'tree_field_code',
					editor:{xtype:'textfield',allowBlank:false}
				},{
					text: 'Description',
					//width: 40,
					width:140,
					dataIndex: 'tree_field_lib',
					editor:{xtype:'textfield',allowBlank:false}
				},{
					text: 'Node Type',
					//width: 40,
					width:210,
					dataIndex: 'tree_field_type',
					renderer: treeFieldTypeRenderer,
					editorTpl:{xtype:'combobox', matchFieldWidth:false,listConfig:{width:200}, forceSelection:true, editable:false, queryMode: 'local',displayField: 'dataTypeLib',valueField: 'dataType',store:this.entryFieldType},
					linkbibleTpl:{xtype:'op5crmbasedelinkbiblefield'},
					buttonTpl:{xtype:'damsembeddedbutton', text:'Configure JOIN'}
				},{
					hidden:true,
					dataIndex:'tree_field_linktype'
				},{
					hidden:true,
					dataIndex:'tree_field_linkbible'
				},{
					xtype: 'booleancolumn',
					type: 'boolean',
					defaultValue : true ,
					text: 'Title?',
					width: 50,
					trueText: '<b>X</b>',
					falseText: '' ,
					align: 'center',
					dataIndex: 'tree_field_is_header',
					editor:{xtype:'checkboxfield'}
				},{
					xtype: 'booleancolumn',
					type: 'boolean',
					defaultValue : true ,
					text: 'Show?',
					width: 50,
					trueText: '<b>X</b>',
					falseText: '' ,
					align: 'center',
					dataIndex: 'tree_field_is_highlight',
					editor:{xtype:'checkboxfield'}
				}]
			}
		});
		var elementtab = new Object() ;
		Ext.apply( elementtab, {
			title:'Element',
			itemId:'elementtab',
			xtype:'damsembeddedgrid',
			columns: {
				defaults: {
					menuDisabled: true,
					draggable: false,
					sortable: false
				},
				items: [{
					text: 'Node Code',
					// width: 40,
					width:140,
					dataIndex: 'entry_field_code',
					editor:{xtype:'textfield',allowBlank:false}
				},{
					text: 'Description',
					//width: 40,
					width:140,
					dataIndex: 'entry_field_lib',
					editor:{xtype:'textfield',allowBlank:false}
				},{
					text: 'Node Type',
					//width: 40,
					width:210,
					dataIndex: 'entry_field_type',
					renderer: entryFieldTypeRenderer,
					editorTpl:{xtype:'combobox', matchFieldWidth:false,listConfig:{width:200}, forceSelection:true, editable:false, queryMode: 'local',displayField: 'dataTypeLib',valueField: 'dataType',store:this.entryFieldType},
					linkbibleTpl:{xtype:'op5crmbasedelinkbiblefield'},
					buttonTpl:{xtype:'damsembeddedbutton', text:'Configure JOIN'}
				},{
					hidden:true,
					dataIndex:'entry_field_linktype'
				},{
					hidden:true,
					dataIndex:'entry_field_linkbible'
				},{
					xtype: 'booleancolumn',
					itemId: 'primaryKeyColumn',
					type: 'boolean',
					defaultValue : false ,
					text: 'Key?',
					width: 50,
					trueText: '<b>X</b>',
					falseText: '' ,
					align: 'center',
					hidden: true,
					dataIndex: 'entry_field_is_primarykey',
					editor:{xtype:'checkboxfield'}
				},{
					xtype: 'booleancolumn',
					type: 'boolean',
					defaultValue : true ,
					text: 'Title?',
					width: 50,
					trueText: '<b>X</b>',
					falseText: '' ,
					align: 'center',
					dataIndex: 'entry_field_is_header',
					editor:{xtype:'checkboxfield'}
				},{
					xtype: 'booleancolumn',
					type: 'boolean',
					defaultValue : true ,
					text: 'Show?',
					width: 50,
					trueText: '<b>X</b>',
					falseText: '' ,
					align: 'center',
					dataIndex: 'entry_field_is_highlight',
					editor:{xtype:'checkboxfield'}
				},{
					xtype: 'booleancolumn',
					type: 'boolean',
					defaultValue : false ,
					text: 'Must?',
					width: 50,
					trueText: '<b>X</b>',
					falseText: '' ,
					align: 'center',
					hidden: !(this.defineDataType == 'file'),
					dataIndex: 'entry_field_is_mandatory',
					editor:{xtype:'checkboxfield'}
				},{
					hidden:true,
					dataIndex:'join_target_file_code'
				},{
					hidden:true,
					dataIndex:'join_select_file_field_code'
				},{
					type:'auto',
					hidden:true,
					dataIndex:'join_map'
				}]
			},
			features: [{
				ftype: 'rowbody',
				getAdditionalData: function(data, rowIndex, record, orig) {
					if( record.get('entry_field_type') != 'join' ) {
						return {
							rowBodyCls: null,
							rowBodyColspan: null,
							rowBody: null
						};
					}
					
					
					
					var localFileCode = me.defineFileId,
						parentFileCode = me.query('form')[0].getForm().findField('store_parent_code').getValue(),
						joinMapRaw = record.get('join_map'),
						joinMap = [],
						rawMapObj ;
					for( var tIdx=0 ; tIdx<joinMapRaw.length ; tIdx++ ) {
						rawMapObj = joinMapRaw[tIdx] ;
						
						joinMap.push({
							joinLocalField: (rawMapObj.join_local_alt_file_code=='' ? '' : ( rawMapObj.join_local_alt_file_code==parentFileCode ? '(parent) ' : '(err???)' ) ) + rawMapObj.join_local_file_field_code,
							joinTargetField: rawMapObj.join_target_file_field_code
						});
					}
					
					var joinCfg = {
						status: ( record.get('join_target_file_code') != '' && record.get('join_select_file_field_code') != '' ),
						joinTargetFile: record.get('join_target_file_code'),
						joinSelectField: record.get('join_select_file_field_code'),
						joinMap:joinMap
					};
					
					var headerCt = this.view.headerCt,
						colspan = headerCt.getColumnCount();
						rowbody = new Ext.XTemplate(
							'<div style="position:relative;">',
							'<tpl if="status">',
								'<table class="op5-crmbase-define-grid-join-tbl" cellspacing="0">',
									'<tbody class="op5-crmbase-define-grid-join-tbody-file"><tr>',
										'<td class="op5-crmbase-define-grid-join-td-icon">&#160;</td>',
										'<td class="op5-crmbase-define-grid-join-td-local"><i>local</i></td>',
										'<td class="op5-crmbase-define-grid-join-td-remote"><b>{joinTargetFile}</b></td>',
									'</tr></tbody>',
									'<tbody class="op5-crmbase-define-grid-join-tbody-map">',
									'<tpl for="joinMap">',
										'<tr>',
										'<tpl if="xindex < 2">',
											'<td rowspan="{[xcount]}" class="op5-crmbase-define-grid-join-td-icon">&#160;</td>',
										'</tpl>',
										'<td class="op5-crmbase-define-grid-join-td-local">{joinLocalField}</td>',
										'<td class="op5-crmbase-define-grid-join-td-remote">{joinTargetField}</td>',
										'</tr>',
									'</tpl>',
									'</tbody>',
									'<tbody class="op5-crmbase-define-grid-join-tbody-select"><tr>',
										'<td class="op5-crmbase-define-grid-join-td-icon">&#160;</td>',
										'<td class="op5-crmbase-define-grid-join-td-local"><i>select :</i></td>',
										'<td class="op5-crmbase-define-grid-join-td-remote"><u>{joinSelectField}</u></td>',
									'</tr></tbody>',
								'</table>',
							'<tpl else>',
								'<div class="op5-crmbase-define-grid-join-erricon"></div>',
								'<div class="op5-crmbase-define-grid-join-errtxt">Incomplete JOIN settings</div>',
							'</tpl>',
							'</div>'
						).apply(joinCfg);
					
					return {
						//rowBody: '<div style="padding: 2px 4px 10px 4px">'++'</div>',
						rowBodyCls: "op5-crmbase-define-grid-joinbody",
						rowBodyColspan: colspan,
						rowBody: rowbody
					};
				}
			}]
		});
		var fieldstab = new Object() ;
		Ext.apply( fieldstab, {
			title:'Fields',
			itemId:'fieldstab',
			xtype:'damsembeddedgrid',
			columns: {
				defaults: {
					menuDisabled: true,
					draggable: false,
					sortable: false
				},
				items: [{
					text: 'Field Code',
					// width: 40,
					width:220,
					dataIndex: 'table_field_code',
					editor:{xtype:'textfield',allowBlank:false}
				},{
					text: 'Node Type',
					//width: 40,
					width:210,
					dataIndex: 'table_field_type',
					renderer: tableFieldTypeRenderer,
					linkbibleTpl:{xtype:'displayfield'},
					editorTpl:{xtype:'combobox', matchFieldWidth:false,listConfig:{width:200}, forceSelection:true, editable:false, queryMode: 'local',displayField: 'dataTypeLib',valueField: 'dataType',store:this.tableFieldType}
				},{
					xtype: 'booleancolumn',
					itemId: 'primaryKeyColumn',
					type: 'boolean',
					defaultValue : false ,
					text: 'Key?',
					width: 50,
					trueText: '<b>X</b>',
					falseText: '' ,
					align: 'center',
					hidden: true,
					dataIndex: 'table_field_is_primarykey',
					editor:{xtype:'checkboxfield'}
				},{
					xtype: 'booleancolumn',
					type: 'boolean',
					defaultValue : true ,
					text: 'Index?',
					width: 50,
					trueText: '<b>X</b>',
					falseText: '' ,
					align: 'center',
					dataIndex: 'table_field_is_index',
					editor:{xtype:'checkboxfield'}
				}]
			}
		});
		
		switch( this.defineDataType ) {
			case 'bible' :
				tabitems.push( treetab ) ;
				tabitems.push( elementtab ) ;
				break;
			
			case 'file' :
				tabitems.push( elementtab ) ;
				tabitems.push( calendartab ) ;
				break;
			
			case 'table' :
				tabitems.push( fieldstab ) ;
				break;
		}
		
		var formitems = new Array() ;
		if( this.defineDataType == 'bible' ){
			formitems = [{
				xtype: 'textfield',
				name: 'store_code',
				fieldLabel: 'Bible Code',
				maxWidth: 200,
				readOnly : (this.defineIsNew == false)
			}, {
				xtype: 'textfield',
				name: 'store_lib',
				fieldLabel: 'Description',
				maxWidth: 300
			},{
				xtype: 'checkboxfield',
				name: 'gmap_is_on',
				fieldLabel: 'Gmap/Adr',
				boxLabel: 'Enable'
			},{
				xtype: 'checkboxfield',
				name: 'gallery_is_on',
				fieldLabel: 'Bible gallery',
				boxLabel: 'Enable'
			}] ;
		}
		if( this.defineDataType == 'file' ){
			formitems = [{
				xtype: 'fieldcontainer',
				fieldLabel: 'File Code / Type',
				layout: 'hbox',
				height: 22,
				items : [{
					xtype: 'textfield',
					name: 'store_code',
					maxWidth: 200,
					readOnly : (this.defineIsNew == false)
				},{
					xtype: 'box',
					html: '&#160;',
					width: 6
				},{
					xtype:'combobox', 
					name: 'store_type',
					forceSelection:true,
					editable:false,
					queryMode: 'local',
					displayField: 'storeTypeLib' ,
					valueField: 'storeType',
					maxWidth: 300,
					store:{
						fields: ['storeType', 'storeTypeLib'],
						data: [
							{"storeType":"","storeTypeLib":"Std / Fieldset"},
							{"storeType":"file_primarykey","storeTypeLib":"File w/ primarykey"},
							{"storeType":"calendar","storeTypeLib":"Calendar"},
							{"storeType":"media_img","storeTypeLib":"Media : pictures"}
						]
					},
					//readOnly : (this.defineIsNew == false),
					listeners: {
						select:{
							fn: this.calcFormLayout,
							scope : this
						}
					}
				}]
			},{
				xtype:'comboboxcached', 
				name: 'store_parent_code',
				fieldLabel: 'Parent file',
				forceSelection:true,
				editable:false,
				queryMode: 'local',
				displayField: 'fileLib' ,
				valueField: 'fileCode',
				maxWidth: 300,
				store:this.parentFiles
			},{
				xtype: 'textfield',
				name: 'store_lib',
				fieldLabel: 'Description',
				maxWidth: 300
			},{
				xtype: 'checkboxfield',
				name: 'gmap_is_on',
				fieldLabel: 'Gmap/Adr',
				boxLabel: 'Enable'
			}] ;
		}
		if( this.defineDataType == 'table' ){
			formitems = [{
				xtype: 'fieldcontainer',
				fieldLabel: 'Table Code / Type',
				layout: 'hbox',
				height: 22,
				items : [{
					xtype: 'textfield',
					name: 'store_code',
					maxWidth: 200,
					readOnly : (this.defineIsNew == false)
				},{
					xtype: 'box',
					html: '&#160;',
					width: 6
				},{
					xtype:'combobox', 
					name: 'store_type',
					forceSelection:true,
					editable:false,
					queryMode: 'local',
					displayField: 'storeTypeLib' ,
					valueField: 'storeType',
					width: 200,
					store:{
						fields: ['storeType', 'storeTypeLib'],
						data: [
							{"storeType":"","storeTypeLib":"Std / Fieldset"},
							{"storeType":"table_primarykey","storeTypeLib":"Table w/ primarykey"},
							{"storeType":"table_primarykey_binary","storeTypeLib":"Table w/ primarykey + store file"}
						]
					},
					//readOnly : (this.defineIsNew == false),
					listeners: {
						select:{
							fn: this.calcFormLayout,
							scope : this
						}
					}
				}]
			},Ext.create('Optima5.Modules.CrmBase.DefineStoreTagsField',{
				fieldLabel: 'Tags',
				name: 'store_tags'
			})] ;
		}
		
		// console.log('Creation define '+this.defineDataType+' '+this.defineBibleId) ;
		Ext.apply(this,{
			layout:{
				type:'vbox',
				align:'stretch'
			},
			
			items : [{
				xtype:'form',
				flex: (this.defineDataType != 'table' ? 1 : undefined),
				frame: true,
				bodyPadding: 5,
				fieldDefaults: {
						labelAlign: 'left',
						labelWidth: 100,
						anchor: '100%'
				},
				layout: 'anchor',
				items: formitems
			},{
				xtype:'tabpanel' ,
				deferredRender: false,
				flex: 3,
				//frame: true,
				activeTab: 0,
				hidden: true,
				defaults :{
						// bodyPadding: 10
				},
				items: tabitems
			}],
					 
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'bottom',
				ui: 'footer',
				defaults: {minWidth: 100},
				items: [
					{ xtype: 'component', flex: 1 },
					{ xtype: 'button', text: 'Save & Apply' , handler:this.onSave, scope:this },
					{ xtype: 'button', text: 'Cancel' , handler:this.onAbort , scope:this }
				]
			}]
		});
		
		this.on('afterrender',this.initLoadEverything,this,{single:true}) ;
		this.on('afterrender',this.configureEditors,this,{single:true}) ;
		
		this.callParent() ;
	},
			  
			  
	initLoadEverything: function() {
		var me = this ;
		
		// Question ? store_type (bible, file) + store_id
		var ajaxParams = {
			_action : 'define_manageTransaction',
			data_type : this.defineDataType
		};
		if( this.defineIsNew ) {
			Ext.apply(ajaxParams,{
				_subaction: 'init_new'
			});
		}
		else {
			if( this.defineDataType == 'bible' ) {
				Ext.apply(ajaxParams,{
					_subaction: 'init_modify',
					bible_code: this.defineBibleId
				});
			}
			if( this.defineDataType == 'file' ) {
				Ext.apply(ajaxParams,{
					_subaction: 'init_modify',
					file_code: this.defineFileId
				});
			}
			if( this.defineDataType == 'table' ) {
				Ext.apply(ajaxParams,{
					_subaction: 'init_modify',
					table_code: this.defineTableId
				});
			}
		}
		
		// Envoi AJAX pour ouvrir la session 
		//  => success on applique d'ID de transaction aux composants + LOAD des composants
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false )
					return this.onAbort() ;
				else {
					this.transactionID = Ext.decode(response.responseText).transaction_id ;
					me.loadAll() ;
				}
			},
			scope: me
		});
	},
	loadAll: function() {
		var me = this ;
		if( !me.transactionID ) {
			return ;
		}
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params:{
				_action: 'define_manageTransaction',
				_transaction_id: this.transactionID,
				_subaction:'ent_get'
			},
			success: function(response) {
				me.query('form')[0].getForm().setValues( Ext.decode(response.responseText).data ) ;
				me.calcFormLayout() ;
			},
			scope:me
		}) ;
		
		Ext.Array.each( me.query('tabpanel')[0].query('damsembeddedgrid') , function(item){
			var params = {
				_action: 'define_manageTransaction',
				_transaction_id: me.transactionID
			};
			switch( item.itemId ) {
				case 'treetab' :
					params['_subaction']='treeFields_get' ;
					break ;
				case 'elementtab' :
					params['_subaction']='entryFields_get' ;
					break ;
				case 'fieldstab' :
					params['_subaction']='fields_get' ;
					break ;
				default :
					console.log('???') ;
					return ;
			}
			
			me.optimaModule.getConfiguredAjaxConnection().request({
				params:params,
				success: function(response) {
					item.setTabData( Ext.decode(response.responseText).data ) ;
				},
				scope:me
			}) ;
		},me) ;
		
		var calendarTab = this.query('> tabpanel')[0].child('#calendartab')
		if( calendarTab != null ) {
			var params = {
				_action: 'define_manageTransaction',
				_transaction_id: me.transactionID,
			  _subaction:'calendarCfg_get'
			};
			
			me.optimaModule.getConfiguredAjaxConnection().request({
				params:params,
				success: function(response) {
					calendarTab.setValues( Ext.decode(response.responseText).data ) ;
				},
				scope:me
			}) ;
		}
					
		me.populateFieldTypesStores(this.transactionID) ;
		//me.calcFormLayout() ;
		
		
	},
	
	configureEditors: function() {
		var me = this ,
			treegrid = me.query('tabpanel')[0].child('#treetab'),
			elementgrid = me.query('tabpanel')[0].child('#elementtab'),
			fieldsgrid = me.query('tabpanel')[0].child('#fieldstab') ;
		
		if( treegrid != null ) {
			treegrid.getPlugin('rowEditor').on({
				'beforeedit': {
					fn: me.onBeforeEditTreeGrid,
					scope: me
				},
				'edit': {
					fn: me.onAfterEditTreeGrid,
					scope: me
				}
			});
		}
		if( elementgrid != null ) {
			elementgrid.getPlugin('rowEditor').on({
				'beforeedit': {
					fn: me.onBeforeEditElementGrid,
					scope: me
				},
				'edit': {
					fn: me.onAfterEditElementGrid,
					scope: me
				}
			});
		}
		if( fieldsgrid != null ) {
			fieldsgrid.getPlugin('rowEditor').on({
				'beforeedit': {
					fn: me.onBeforeEditFieldsGrid,
					scope: me
				},
				'edit': {
					fn: me.onAfterEditFieldsGrid,
					scope: me
				}
			});
		}
		
		if( this.defineDataType == 'bible' ) {
			treegrid.child('toolbar').child('#add').handler = null 
			var addMenu = [{
					iconCls:'icon-add',
					text:'Data Field',
					handler:function(btn) {
						var p = btn.up('damsembeddedgrid') ;
						p.onBtnAdd({}) ;
					},
					scope:me
				},{
					icon:'images/op5img/ico_dataadd_16.gif',
					text:'Bible LINK',
					handler:function(btn) {
						var p = btn.up('damsembeddedgrid') ;
						p.onBtnAdd({
							tree_field_type:'link'
						}) ;
					},
					scope:me
				}] ;
			treegrid.child('toolbar').child('#add').menu.add(addMenu);
			
			elementgrid.child('toolbar').child('#add').handler = null 
			var addMenu = [{
					iconCls:'icon-add',
					text:'Data Field',
					handler:function(btn) {
						var p = btn.up('damsembeddedgrid') ;
						p.onBtnAdd({}) ;
					},
					scope:me
				},{
					icon:'images/op5img/ico_dataadd_16.gif',
					text:'Bible LINK',
					handler:function(btn) {
						var p = btn.up('damsembeddedgrid') ;
						p.onBtnAdd({
							entry_field_type:'link'
						}) ;
					},
					scope:me
				}] ;
			elementgrid.child('toolbar').child('#add').menu.add(addMenu);
		}
		if( this.defineDataType == 'file' ) {
			elementgrid.child('toolbar').child('#add').handler = null 
			var addMenu = [{
					iconCls:'icon-add',
					text:'Data Field',
					handler:function(btn) {
						var p = btn.up('damsembeddedgrid') ;
						p.onBtnAdd({}) ;
					},
					scope:me
				},{
					icon:'images/op5img/ico_dataadd_16.gif',
					text:'Bible LINK',
					handler:function(btn) {
						var p = btn.up('damsembeddedgrid') ;
						p.onBtnAdd({
							entry_field_type:'link'
						}) ;
					},
					scope:me
				},{
					icon:'images/op5img/ico_filechild_16.gif',
					text:'Table JOIN',
					handler:function(btn) {
						var p = btn.up('damsembeddedgrid') ;
						p.onBtnAdd({
							entry_field_type:'join'
						}) ;
					},
					scope:me
				}] ;
			elementgrid.child('toolbar').child('#add').menu.add(addMenu);
		}
		if( this.defineDataType == 'table' ) {
			
		}
	},
	onBeforeEditTreeGrid: function(editor,editEvent) {
		return this.onBeforeEditGrid( editor,editEvent,'tree' ) ;
	},
	onBeforeEditElementGrid: function(editor,editEvent) {
		return this.onBeforeEditGrid( editor,editEvent,'element' ) ;
	},
	onBeforeEditFieldsGrid: function(editor,editEvent) {
		return this.onBeforeEditGrid( editor,editEvent,'fields' ) ;
	},
	onBeforeEditGrid: function(editor,editEvent,gridType) {
		var me = this ;
		
		editor.cancelEdit() ;
		
		var columnsByKey = {} ;
		Ext.Array.forEach( editEvent.grid.columns, function(col) {
			columnsByKey[col.dataIndex] = col ;
		},me);
		
		var fieldTypeColumnKey, fieldLinktypeColumnKey, fieldLinkbibleColumnKey ;
		switch( gridType ) {
			case 'tree' :
				fieldTypeColumnKey = 'tree_field_type' ;
				fieldLinktypeColumnKey = 'tree_field_linktype' ;
				fieldLinkbibleColumnKey = 'tree_field_linkbible' ;
				break ;
			case 'element' :
				fieldTypeColumnKey = 'entry_field_type' ;
				fieldLinktypeColumnKey = 'entry_field_linktype' ;
				fieldLinkbibleColumnKey = 'entry_field_linkbible' ;
				break ;
			case 'fields' :
				fieldTypeColumnKey = 'table_field_type' ;
				break ;
		}
		var fieldType = ( (editEvent.record != null) ? editEvent.record.get(fieldTypeColumnKey) : null ) ;
		var fieldTypeColumn = columnsByKey[fieldTypeColumnKey] ;
		
		if( fieldType == 'join' ) {
			var buttonTpl = Ext.apply({},fieldTypeColumn.buttonTpl) ;
			Ext.apply(buttonTpl,{
				rowIdx: editEvent.store.indexOf(editEvent.record),
				handler: function(btn) {
					me.onClickJoinCfg(btn.rowIdx) ;
				},
				scope:me
			});
			
			fieldTypeColumn.setEditor(buttonTpl) ;
		} else if( fieldType == 'link' ) {
			var linkbibleTpl = Ext.apply({},fieldTypeColumn.linkbibleTpl) ;
			
			var linktypeStore ;
			switch( me.defineDataType ) {
				case 'bible' :
					linktypeStore = me.linktypesForBible ;
					break ;
				case 'file' :
					linktypeStore = me.linktypesForFile ;
					break ;
			}
			Ext.apply(linkbibleTpl,{
				linkBiblesStore: me.linkBibles,
				linkTypesStore: linktypeStore,
				
				listeners: {
					afterrender: function(formField) {
						formField.setLinkValues({
							linkType: editEvent.record.get(fieldLinktypeColumnKey),
							linkBibleCode: editEvent.record.get(fieldLinkbibleColumnKey)
						}) ;
					}
				}
			});
			fieldTypeColumn.setEditor(linkbibleTpl) ;
		} else {
			fieldTypeColumn.setEditor(fieldTypeColumn.editorTpl) ;
		}
	},
	onAfterEditTreeGrid: function(editor,editEvent) {
		return this.onAfterEditGrid( editor,editEvent,'tree' ) ;
	},
	onAfterEditElementGrid: function(editor,editEvent) {
		return this.onAfterEditGrid( editor,editEvent,'element' ) ;
	},
	onAfterEditFieldsGrid: function(editor,editEvent) {
		return this.onAfterEditGrid( editor,editEvent,'fields' ) ;
	},
	onAfterEditGrid: function(editor,editEvent,gridType) {
		var me = this ;
		
		var columnsByKey = {} ;
		Ext.Array.forEach( editEvent.grid.columns, function(col) {
			columnsByKey[col.dataIndex] = col ;
		},me);
		
		var fieldTypeColumnKey, fieldLinktypeColumnKey, fieldLinkbibleColumnKey ;
		switch( gridType ) {
			case 'tree' :
				fieldTypeColumnKey = 'tree_field_type' ;
				fieldLinktypeColumnKey = 'tree_field_linktype' ;
				fieldLinkbibleColumnKey = 'tree_field_linkbible' ;
				break ;
			case 'element' :
				fieldTypeColumnKey = 'entry_field_type' ;
				fieldLinktypeColumnKey = 'entry_field_linktype' ;
				fieldLinkbibleColumnKey = 'entry_field_linkbible' ;
				break ;
			case 'fields' :
				fieldTypeColumnKey = 'table_field_type' ;
				break ;
		}
		var fieldType = ( (editEvent.record != null) ? editEvent.record.get(fieldTypeColumnKey) : null ) ;
		var fieldTypeColumn = columnsByKey[fieldTypeColumnKey] ;
		var formField = fieldTypeColumn.getEditor() ;
		
		switch( formField.getXType() ) {
			case fieldTypeColumn.linkbibleTpl.xtype :
				editEvent.record.set(fieldTypeColumnKey, 'link') ;
				editEvent.record.set(fieldLinktypeColumnKey, formField.getLinkValues().linkType) ;
				editEvent.record.set(fieldLinkbibleColumnKey, formField.getLinkValues().linkBibleCode) ;
				break ;
		}
	},
	onClickJoinCfg: function( rowIdx ) {
		var me = this ,
			tabpanel = me.query('tabpanel')[0],
			elementgrid = tabpanel.child('#elementtab'),
			editPlugin = elementgrid.getPlugin('rowEditor') ;
			
		//editPlugin.completeEdit() ;
		// console.log('Advanced editing for row '+rowIdx) ;
		
		// Create panel
		if( !me.joinPanel ) {
			var tabpanelSize = tabpanel.getSize() ;
			me.joinPanel = Ext.create('Optima5.Modules.CrmBase.DefineStoreFieldJoinPanel',{
				defineStorePanel: me,
				
				width: tabpanelSize.width,
				height: tabpanelSize.height,
				
				floating: true,
				renderTo: me.getEl(),
				tools: [{
					type: 'close',
					handler: function(e, t, p) {
						p.ownerCt.hide();
					}
				}]
			});
		}
		// Size + position
		me.joinPanel.setSize({
			width: tabpanel.getSize().width - 20,
			height: tabpanel.getSize().height - 20
		}) ;
		me.joinPanel.on('hide',function() {
			me.getEl().unmask() ;
		},me,{single:true}) ;
		me.getEl().mask() ;
		
		me.joinPanel.setElementtabIdx( rowIdx ) ;
		
		me.joinPanel.show();
		me.joinPanel.getEl().alignTo(tabpanel.getEl(), 'c-c?');
	},
	
	populateFieldTypesStores: function() {
		var me = this ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action : 'define_manageTransaction',
				_subaction : 'tool_getLinks',
				_transaction_id : me.transactionID
			},
			success: function(response) {
				if( Ext.decode(response.responseText).success == false )
					return this.onAbort() ;
				else {
					var parentFilesData = [{"fileCode":"", "fileLib":"<i>Root file / No parent</i>"}] ;
					Ext.Array.each( Ext.decode(response.responseText).data.parent_files, function(parentFileData) {
						parentFilesData.push(parentFileData) ;
					}) ;
					this.parentFiles.loadRawData( parentFilesData ) ;
					
					this.linkBibles.loadRawData( Ext.decode(response.responseText).data.link_bibles ) ;
				}
			},
			scope: this
		});
	},
			  
	calcFormLayout: function() {
		var hideFieldsets=false , hideGmap=false, showPrimarykeyCol=false, showCalendarTab=false ;
		
		this.query('form')[0].getForm().getFields().each( function(formitem,idx) {
			if( formitem.name==='store_type' ) {
				switch( formitem.getValue() ) {
					case 'media_img' :
						hideFieldsets = false ;
						hideGmap = true ;
						showPrimarykeyCol = false ;
						showCalendarTab = false ;
						break ;
					
					case 'calendar' :
						hideFieldsets = false ;
						hideGmap = true ;
						showPrimarykeyCol = false ;
						showCalendarTab = true ;
						break ;
						
					case 'file_primarykey' :
						hideFieldsets = false ;
						hideGmap = false ;
						showPrimarykeyCol = true ;
						showCalendarTab = false ;
						break ;
						
					case 'table_primarykey' :
					case 'table_primarykey_binary' :
						hideFieldsets = false ;
						showPrimarykeyCol = true ;
						break ;
						
					case '' :
					default :
						hideFieldsets = false ;
						hideGmap = false ;
						showPrimarykeyCol = false ;
						showCalendarTab = false ;
						break ;
				}
			}
		},this) ;
		
		
		if( hideFieldsets ) {
			this.query('> tabpanel')[0].hide() ;
		}
		else {
			this.query('> tabpanel')[0].show() ;
		}
		
		var calendarTab = this.query('> tabpanel')[0].child('#calendartab') ;
		if( calendarTab ) {
			if( showCalendarTab ) {
				calendarTab.tab.show();
			}
			else {
				calendarTab.tab.hide();
				this.query('> tabpanel')[0].setActiveTab(0) ;
			}
		}
		
		var elementTab = this.query('> tabpanel')[0].child('#elementtab'),
			primarykeyCol = ( elementTab ? elementTab.query('#primaryKeyColumn')[0] : null ) ;
		if( primarykeyCol ){
			primarykeyCol[showPrimarykeyCol ? 'show' : 'hide']();
		}
		
		var fieldsTab = this.query('> tabpanel')[0].child('#fieldstab'),
			primarykeyCol = ( fieldsTab ? fieldsTab.query('#primaryKeyColumn')[0] : null ) ;
		if( primarykeyCol ){
			primarykeyCol[showPrimarykeyCol ? 'show' : 'hide']();
		}
	},
			  
			  
	onAbort: function(){
		this.destroy() ;
	},
	onSave: function() {
		var me = this ;
		me.nbComponentsSaved = 0 ;
		
		me.on('allsaved',function(nbSaved){
			me.saveAndApply() ;
		},me) ;
		
		var ajaxConnection = me.optimaModule.getConfiguredAjaxConnection()
		
		var params = {
			_action: 'define_manageTransaction',
			_transaction_id: this.transactionID,
			_subaction:'ent_set'
		};
		Ext.apply(params,this.query('form')[0].getForm().getValues()) ;
		ajaxConnection.request({
			params:params,
			success : me.onSaveComponentCallback,
			failure: function(form,action){
				if( action.result.msg )
					Ext.Msg.alert('Failed', action.result.msg);
			},
			scope: me
		}) ;
		
		Ext.each( me.query('tabpanel')[0].query('damsembeddedgrid') , function(item){
			var params = {
				_action: 'define_manageTransaction',
				_transaction_id: me.transactionID
			};
			switch( item.itemId ) {
				case 'treetab' :
					params['_subaction']='treeFields_set' ;
					break ;
				case 'elementtab' :
					params['_subaction']='entryFields_set' ;
					break ;
				case 'fieldstab' :
					params['_subaction']='fields_set' ;
					break ;
				default :
					console.log('???') ;
					return ;
			}
			params['data'] = Ext.encode(item.getTabData()) ;
			
			me.optimaModule.getConfiguredAjaxConnection().request({
				params:params,
				success: me.onSaveComponentCallback,
				scope:me
			}) ;
		},me) ;
		
		
		if( this.query('> tabpanel')[0].child('#calendartab') != null ) {
			var params = {
				_action: 'define_manageTransaction',
				_transaction_id: this.transactionID,
				_subaction:'calendarCfg_set'
			};
			Ext.apply(params,this.query('> tabpanel')[0].child('#calendartab').getValues()) ;
			ajaxConnection.request({
				params:params,
				success : me.onSaveComponentCallback,
				scope: me
			}) ;
		}
	},
	onSaveComponentCallback: function() {
		var me = this ;
		
		if( !me.nbComponentsSaved )
			me.nbComponentsSaved = 0 ;
		
		var nbToSave = 1 ;
		nbToSave += me.query('> tabpanel')[0].query('damsembeddedgrid').length ;
		if( this.query('> tabpanel')[0].child('#calendartab') != null ) {
			nbToSave++ ;
		}

		if( me.nbComponentsSaved >= nbToSave )
			return ;
		me.nbComponentsSaved = me.nbComponentsSaved + 1 ;
		if( me.nbComponentsSaved === nbToSave ) {
			me.fireEvent('allsaved',me.nbComponentsSaved) ;
		}
	},
	saveAndApply: function() {
		var me = this ;
		var msgbox = Ext.Msg.wait('Updating. Please Wait.');
		
		var ajaxParams = {
			_action : 'define_manageTransaction',
			_subaction : 'save_and_apply',
			_transaction_id : this.transactionID
		};
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				msgbox.close() ;
				if( Ext.decode(response.responseText).success == false ) {
					if( Ext.decode(response.responseText).errors ) {
						this.query('form')[0].getForm().markInvalid(Ext.decode(response.responseText).errors) ;
					} else {
						var msg = Ext.decode(response.responseText).msg ;
						if( msg != null ) {
							Ext.Msg.alert('Failed', msg);
						} else {
							Ext.Msg.alert('Failed', 'Save failed. Unknown error');
						}
					}
				}
				else {
					msgbox.close() ;
					this.optimaModule.postCrmEvent('definechange',{
						dataType: this.defineDataType,
						bibleId: this.defineBibleId,
						fileId: this.defineFileId,
						tableId: this.defineTableId
					});
					this.destroy() ;
				}
			},
			scope: this
		});
	},
	
	onDestroy: function() {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: 'define_manageTransaction',
				_transaction_id: this.transactionID,
				_subaction: 'end'
			}
		}) ;
		this.callParent() ;
	}
});
