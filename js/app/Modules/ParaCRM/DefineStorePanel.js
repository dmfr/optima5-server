Ext.define('Optima5.Modules.ParaCRM.DefineStorePanel' ,{
	extend: 'Ext.panel.Panel',
	
	requires : [
		'Optima5.CoreDesktop.Ajax',
		'Ext.ux.dams.RestfulGrid',
		'Optima5.Modules.ParaCRM.DefineStoreCalendarForm',
		'Ext.container.ButtonGroup',
		'Ext.layout.container.Table',
		'Ext.tab.Panel'
	],
	
	initComponent: function() {
		var me = this ;
		
		// Creation du layout : form + tabpanel(restful grid X 2) 
		// Envoi AJAX pour ouvrir la session => success on redirige vers initLoadEverything
		
		
		this.treeFieldType = Ext.create('Ext.data.Store', {
			fields: ['dataType', 'dataTypeLib'],
			data : [
				{"dataType":"string", "dataTypeLib":"Text"},
				{"dataType":"number", "dataTypeLib":"Number"},
				{"dataType":"bool", "dataTypeLib":"Boolean"},
				{"dataType":"date", "dataTypeLib":"Date"}
			]
		});
		this.entryFieldType = Ext.create('Ext.data.Store', {
			fields: ['dataType', 'dataTypeLib'],
			data : [
				{"dataType":"string", "dataTypeLib":"Text"},
				{"dataType":"number", "dataTypeLib":"Number"},
				{"dataType":"bool", "dataTypeLib":"Boolean"},
				{"dataType":"date", "dataTypeLib":"Date"}
			]
		});
		
		this.parentFiles = Ext.create('Ext.data.Store', {
			fields: ['fileCode', 'fileLib'],
			data : [{"fileCode":"", "fileLib":"<i>Root file / No parent</i>"}]
		});
		
		
		var tabitems = new Array() ;
		var calendartab = Ext.create( 'Optima5.Modules.ParaCRM.DefineStoreCalendarForm', {
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
							field_type: rec.get('entry_field_type')
						});
					});
					this.query('> tabpanel')[0].child('#calendartab').loadCurrentlyDefinedFields(fieldsTab) ;
				},
				scope: me
			},
			url : 'server/backend.php',
			baseParams: {
				_sessionName: op5session.get('session_id'),
				_moduleName: 'paracrm' ,
				_action: 'define_manageTransaction' 
			}
		}) ;
		var treetab = new Object() ;
		Ext.apply( treetab, {
			title:'TreeStructure',
			itemId:'treetab',
			xtype:'damsrestfulgrid',
			url : 'server/backend.php',
			baseParams: {
				_sessionName: op5session.get('session_id'),
				_moduleName: 'paracrm' ,
				_action: 'define_manageTransaction' 
			},
			loadParams: {
				_subaction: 'treeFields_get'
			},
			saveParams: {
				_subaction: 'treeFields_set'
			},
			columns: [{
				text: 'Node Code',
				// width: 40,
				sortable: false,
				width:140,
				dataIndex: 'tree_field_code',
				editor:{xtype:'textfield',allowBlank:false}
			},{
				text: 'Description',
				//width: 40,
				sortable: false,
				width:140,
				dataIndex: 'tree_field_lib',
				editor:{xtype:'textfield',allowBlank:false}
			},{
				text: 'Node Type',
				//width: 40,
				sortable: false,
				width:100,
				dataIndex: 'tree_field_type',
				editor:{xtype:'combobox', forceSelection:true, editable:false, queryMode: 'local',displayField: 'dataTypeLib',valueField: 'dataType',store:this.treeFieldType}
			},{
				xtype: 'booleancolumn',
				type: 'boolean',
				defaultValue : true ,
				text: 'Title?',
				width: 50,
				trueText: '<b>X</b>',
				falseText: '' ,
				align: 'center',
				sortable: false,
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
				sortable: false,
				dataIndex: 'tree_field_is_highlight',
				editor:{xtype:'checkboxfield'}
			}]
		});
		var elementtab = new Object() ;
		Ext.apply( elementtab, {
			title:'Element',
			itemId:'elementtab',
			xtype:'damsrestfulgrid',
			url : 'server/backend.php',
			baseParams: {
				_sessionName: op5session.get('session_id'),
				_moduleName: 'paracrm' ,
				_action: 'define_manageTransaction' 
			},
			loadParams: {
				_subaction: 'entryFields_get'
			},
			saveParams: {
				_subaction: 'entryFields_set'
			},
			columns: [{
				text: 'Node Code',
				// width: 40,
				sortable: false,
				width:140,
				dataIndex: 'entry_field_code',
				editor:{xtype:'textfield',allowBlank:false}
			},{
				text: 'Description',
				//width: 40,
				sortable: false,
				width:140,
				dataIndex: 'entry_field_lib',
				editor:{xtype:'textfield',allowBlank:false}
			},{
				text: 'Node Type',
				//width: 40,
				sortable: false,
				width:100,
				dataIndex: 'entry_field_type',
				editor:{xtype:'combobox', forceSelection:true, editable:false, queryMode: 'local',displayField: 'dataTypeLib',valueField: 'dataType',store:this.entryFieldType}
			},{
				xtype: 'booleancolumn',
				type: 'boolean',
				defaultValue : true ,
				text: 'Title?',
				width: 50,
				trueText: '<b>X</b>',
				falseText: '' ,
				align: 'center',
				sortable: false,
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
				sortable: false,
				dataIndex: 'entry_field_is_highlight',
				editor:{xtype:'checkboxfield'}
			}]
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
					xtype: 'splitter'
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
							{"storeType":"calendar","storeTypeLib":"Calendar"},
							{"storeType":"media_img","storeTypeLib":"Media : pictures"}
						]
					},
					//readOnly : (this.defineIsNew == false),
					listeners: {
						select:{
							fn: this.updateLayout,
							scope : this
						}
					}
				}]
			},{
				xtype:'combobox', 
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
		
		// console.log('Creation define '+this.defineDataType+' '+this.defineBibleId) ;
		Ext.apply(this,{
			layout:{
				type:'vbox',
				align:'stretch'
			},
			
			items : [{
				xtype:'form',
				flex: 1,
				url : 'server/backend.php',
				baseParams: {
					_sessionName: op5session.get('session_id'),
					_moduleName: 'paracrm' ,
					_action: 'define_manageTransaction' 
				},
				frame: true,
				bodyPadding: 5,
				fieldDefaults: {
						labelAlign: 'left',
						labelWidth: 100,
						anchor: '100%'
				},
				items: formitems
			},{
				xtype:'tabpanel' ,
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
		
		// this.on('beforedestroy',this.onClose,this) ;
		this.on('afterrender',this.initLoadEverything,this) ;
		
		this.addEvents('definechanged') ;
		
		this.callParent() ;
	},
			  
			  
	initLoadEverything: function() {
		// Question ? store_type (bible, file) + store_id
		var ajaxParams = {
			_moduleName: 'paracrm',
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
		}
		
		// Envoi AJAX pour ouvrir la session 
		//  => success on applique d'ID de transaction aux composants + LOAD des composants
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false )
					return this.onAbort() ;
				else {
					this.transactionID = Ext.decode(response.responseText).transaction_id ;
					
					// On applique l'ID de transaction et on load le formulaire
					Ext.apply( this.query('form')[0].baseParams, {
						_transaction_id: this.transactionID
					});
					this.query('form')[0].load({
						params:{ _subaction:'ent_get' },
						success: this.updateLayout,
						scope: this
					}) ;
					
					// On applique l'ID de transaction et on load
					Ext.each( this.query('tabpanel')[0].query('damsrestfulgrid') , function(item){
						Ext.apply( item.baseParams,{
							_transaction_id: this.transactionID
						});
						item.load() ;
						item.getStore().on('update',function(){
							item.save() ;
						},this) ;
						item.getStore().on('remove',function(){
							item.save() ;
						},this) ;
					},this) ;
					
					
					var calendarTab = this.query('> tabpanel')[0].child('#calendartab')
					if( calendarTab != null ) {
						Ext.apply( calendarTab.baseParams, {
							_transaction_id: this.transactionID
						}) ;
						
						calendarTab.load() ;
					}
					
					
					this.populateFieldTypesStores(this.transactionID) ;
					//this.updateLayout() ;
				}
			},
			scope: this
		});
	},
	
	populateFieldTypesStores: function() {
		var ajaxParams = {
			_moduleName: 'paracrm',
			_action : 'define_manageTransaction',
			_subaction : 'tool_getLinks',
			_transaction_id : this.transactionID
		};
		
		
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false )
					return this.onAbort() ;
				else {
					this.treeFieldType.add( Ext.decode(response.responseText).data.links_tree ) ;
					this.entryFieldType.add( Ext.decode(response.responseText).data.links_entry ) ;
					this.parentFiles.add( Ext.decode(response.responseText).data.parent_files ) ;
				}
			},
			scope: this
		});
	},
			  
	updateLayout: function() {
		var hideFieldsets=false , hideGmap=false ;
		this.query('form')[0].getForm().getFields().each( function(formitem,idx) {
			if( formitem.name==='store_type' ) {
				switch( formitem.getValue() ) {
					case 'media_img' :
						hideFieldsets = true ;
						hideGmap = true ;
						showCalendarTab = false ;
						break ;
					
					case 'calendar' :
						hideFieldsets = false ;
						hideGmap = true ;
						showCalendarTab = true ;
						break ;
						
					case '' :
					default :
						hideFieldsets = false ;
						hideGmap = false ;
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
		
		
		
	},
			  
			  
	onClose: function(){
		Ext.Msg.alert('Status', 'Arret de la transaction');
	},
	onAbort: function(){
		this.destroy() ;
	},
	onSave: function() {
		var me = this ;
		this.query('form')[0].submit({
			params:{ _subaction:'ent_set' },
			success : me.saveAll,
			failure: function(form,action){
				if( action.result.msg )
					Ext.Msg.alert('Failed', action.result.msg);
			},
			scope: this
		}) ;
		
	},
	saveAll: function() {
		var me = this ;
		me.nbComponentsSaved = 0 ;
		
		me.addEvents('allsaved') ;
		me.on('allsaved',function(nbSaved){
			me.saveAndApply() ;
		},me) ;
		
		me.query('form')[0].submit({
			params:{ _subaction:'ent_set' },
			success : me.onSaveComponentCallback,
			failure: function(form,action){
				if( action.result && action.result.msg )
					Ext.Msg.alert('Failed', action.result.msg);
			},
			scope: me
		}) ;
		
		if( this.query('> tabpanel')[0].child('#calendartab') != null ) {
			this.query('> tabpanel')[0].child('#calendartab').save(me.onSaveComponentCallback,me) ;
		}
	},
	onSaveComponentCallback: function() {
		var me = this ;
		
		if( !me.nbComponentsSaved )
			me.nbComponentsSaved = 0 ;
		
		var nbToSave = 1 ;
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
		var msgbox = Ext.Msg.wait('Updating. Please Wait.');
		
		var ajaxParams = {
			_moduleName: 'paracrm',
			_action : 'define_manageTransaction',
			_subaction : 'save_and_apply',
			_transaction_id : this.transactionID
		};
		
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				msgbox.close() ;
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Save failed. Unknown error');
				}
				else {
					msgbox.close() ;
					this.fireEvent('definechanged',{
						dataType: this.defineDataType,
						bibleId: this.defineBibleId,
						fileId: this.defineFileId
					});
					this.destroy() ;
				}
			},
			scope: this
		});
	}
	
});