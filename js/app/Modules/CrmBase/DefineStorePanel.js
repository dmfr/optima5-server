Ext.define('Optima5.Modules.CrmBase.DefineStorePanel' ,{
	extend: 'Ext.panel.Panel',
	
	requires : [
		'Ext.ux.dams.EmbeddedGrid',
		'Optima5.Modules.CrmBase.DefineStoreCalendarForm',
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
				{"dataType":"string", "dataTypeLib":"Text"},
				{"dataType":"number", "dataTypeLib":"Number"},
				{"dataType":"bool", "dataTypeLib":"Boolean"},
				{"dataType":"date", "dataTypeLib":"Date"}
			]
		});
		this.entryFieldType = Ext.create('Ext.data.Store', {
			fields: ['dataType', 'dataTypeLib'],
			data : [
				{"dataType":"_label", "dataTypeLib":"None/Label"},
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
							field_type: rec.get('entry_field_type')
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
				width:150,
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
			xtype:'damsembeddedgrid',
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
				width:150,
				dataIndex: 'entry_field_type',
				editor:{xtype:'combobox', matchFieldWidth:false,listConfig:{width:200}, forceSelection:true, editable:false, queryMode: 'local',displayField: 'dataTypeLib',valueField: 'dataType',store:this.entryFieldType}
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
				editor:{xtype:'checkboxfield',padding:'0 0 0 16 '}
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
				editor:{xtype:'checkboxfield',padding:'0 0 0 16 '}
			}]
		});
		if( this.defineDataType == 'file' ) {
			elementtab.columns.push({
				xtype: 'booleancolumn',
				type: 'boolean',
				defaultValue : false ,
				text: 'Must?',
				width: 50,
				trueText: '<b>X</b>',
				falseText: '' ,
				align: 'center',
				sortable: false,
				dataIndex: 'entry_field_is_mandatory',
				editor:{xtype:'checkboxfield',padding:'0 0 0 16 '}
			}) ;
		}
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
		
		// console.log('Creation define '+this.defineDataType+' '+this.defineBibleId) ;
		Ext.apply(this,{
			layout:{
				type:'vbox',
				align:'stretch'
			},
			
			items : [{
				xtype:'form',
				flex: 1,
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
		
		this.on('afterrender',this.initLoadEverything,this) ;
		
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
				me.updateLayout() ;
			},
			scope:me
		}) ;
		
		Ext.Array.each( me.query('tabpanel')[0].query('damsembeddedgrid') , function(item){
			var params = {
				_action: 'define_manageTransaction',
				_transaction_id: me.transactionID,
			};
			switch( item.itemId ) {
				case 'treetab' :
					params['_subaction']='treeFields_get' ;
					break ;
				case 'elementtab' :
					params['_subaction']='entryFields_get' ;
					break ;
				default :
					console.log('???') ;
					return ;
			}
			
			me.optimaModule.getConfiguredAjaxConnection().request({
				params:params,
				success: function(response) {
					item.setData( Ext.decode(response.responseText).data ) ;
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
		//me.updateLayout() ;
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
			  
			  
	onAbort: function(){
		this.destroy() ;
	},
	onSave: function() {
		var me = this ;
		
		var params = {
			_action: 'define_manageTransaction',
			_transaction_id: this.transactionID,
			_subaction:'ent_set'
		};
		Ext.apply(params,this.query('form')[0].getForm().getValues()) ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params:params,
			success : function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					if( Ext.decode(response.responseText).errors ) {
						this.query('form')[0].getForm().markInvalid(Ext.decode(response.responseText).errors) ;
					} else {
						Ext.Msg.alert('Failed', 'Save failed. Unknown error');
					}
				}
				else {
					me.saveAll() ;
				}
			},
			failure: function(form,action){
				if( action.result.msg )
					Ext.Msg.alert('Failed', action.result.msg);
			},
			scope: me
		}) ;
	},
	saveAll: function() {
		var me = this ;
		me.nbComponentsSaved = 0 ;
		
		me.addEvents('allsaved') ;
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
				_transaction_id: me.transactionID,
			};
			switch( item.itemId ) {
				case 'treetab' :
					params['_subaction']='treeFields_set' ;
					break ;
				case 'elementtab' :
					params['_subaction']='entryFields_set' ;
					break ;
				default :
					console.log('???') ;
					return ;
			}
			params['data'] = Ext.encode(item.getData()) ;
			
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
					Ext.Msg.alert('Failed', 'Save failed. Unknown error');
				}
				else {
					msgbox.close() ;
					this.optimaModule.postCrmEvent('definechange',{
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