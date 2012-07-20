Ext.define('DefineStoreCalendarFormModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'field_code',  type: 'string'},
        {name: 'field_desc',  type: 'string'},
        {name: 'field_type',  type: 'string'}
    ],
    idProperty:'field_code'
});
Ext.define('Optima5.Modules.ParaCRM.DefineStoreCalendarForm' ,{
	extend: 'Ext.form.Panel',
			  
	requires: [
		'Ext.ux.dams.ComboBoxCached'
	],
			  
	bibleId: '',
			  
	initComponent: function() {
		var me = this ;
		
		me.fieldsStore = Ext.create('Ext.data.Store',{
			model:'DefineStoreCalendarFormModel',
			data : []
		}) ;
		
		Ext.apply(me,{
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 75,
				anchor: '100%'
			},
			layout: 'anchor',
			items:[{
				xtype: 'checkboxfield',
				name: 'account_is_on',
				itemId: 'account_is_on',
				boxLabel: 'Use account / subscription'
			},{
				xtype: 'fieldset',
				hidden: true,
				title: 'Account target',
				itemId: 'account_row',
				defaults: {anchor: '100%'},
				items : [{
					xtype: 'comboboxcached',
					maxWidth:225,
					itemId: 'account_filefield',
					name: 'account_filefield',
					forceSelection: true,
					editable: false,
					store: me.fieldsStore,
					queryMode: 'local',
					displayField: 'field_desc',
					valueField: 'field_code'
				}]
			},{
				xtype: 'comboboxcached',
				maxWidth:300,
				fieldLabel: 'Event start',
				name: 'eventstart_filefield',
				forceSelection: true,
				editable: false,
				store: me.fieldsStore,
				queryMode: 'local',
				displayField: 'field_desc',
				valueField: 'field_code'
			},{
				xtype: 'comboboxcached',
				maxWidth:300,
				fieldLabel: 'Event end',
				name: 'eventend_filefield',
				forceSelection: true,
				editable: false,
				store: me.fieldsStore,
				queryMode: 'local',
				displayField: 'field_desc',
				valueField: 'field_code'
			},{
				xtype: 'checkboxfield',
				name: 'duration_is_fixed',
				itemId: 'duration_is_fixed',
				boxLabel: 'Fixed event duration'
			},{
				xtype: 'fieldset',
				hidden: true,
				title: 'Source duration for event',
				itemId: 'duration_row',
				layout: 'hbox',
				items : [{
					xtype: 'comboboxcached',
					flex:1,
					maxWidth:300,
					itemId: 'duration_src_filefield',
					name: 'duration_src_filefield',
					forceSelection: true,
					editable: false,
					store: me.fieldsStore,
					queryMode: 'local',
					displayField: 'field_desc',
					valueField: 'field_code',
					listeners: {
						select:function(){
							me.child('#duration_row').child('#duration_src_biblefield').setValue('') ;
							me.syncDurationFields() ;
						},
						scope:me
					}
				},{
					xtype: 'splitter'
				},{
					xtype:'comboboxcached', 
					flex:1,
					maxWidth:300,
					itemId: 'duration_src_biblefield',
					name: 'duration_src_biblefield',
					forceSelection:true,
					editable:false,
					queryMode: 'local',
					displayField: 'bible_field_desc' ,
					valueField: 'bible_field_code',
					store:{
						fields: ['bible_field_code', 'bible_field_desc'],
						data: []
					}
				}]
			}]
		});
		
		this.callParent() ;
		
		me.fieldsStore.on('datachanged',function(){
			me.syncDurationFields() ;
		},me) ;
		
		this.getForm().getFields().each(function(field) {
			field.on('change',function(){
				me.calcLayout() ;
			},me) ;
		},me) ;
	},
	calcLayout: function(){
		var me = this ;
		
		me.child('#account_row').setVisible( me.child('#account_is_on').getValue() ) ;
		me.child('#duration_row').setVisible( me.child('#duration_is_fixed').getValue() ) ;
	},
	
	loadCurrentlyDefinedFields:function(data){
		var me = this ;
		me.fieldsStore.loadData(data) ;
	},
			  
	syncDurationFields: function(){
		var me = this ;

		var mTargetCombo = me.child('#duration_row').child('#duration_src_biblefield') ;
		mTargetCombo.getStore().removeAll() ;
		
		var mSelectedValue = me.child('#duration_row').child('#duration_src_filefield').getValue() ;
		
		var mSelectedRecord = me.fieldsStore.getById(mSelectedValue) ;
		if( mSelectedRecord == null ) {
			return ;
		}
		var mSelectedRecordType = mSelectedRecord.get('field_type') ;
		if( mSelectedRecordType.indexOf('link_') != 0 ) {
			return ;
		}
		var mSelectedRecordBiblecode = mSelectedRecordType.substr(5) ;
		
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: {
				_moduleName: 'paracrm',
				_action : 'data_getBibleCfg',
				bible_code : mSelectedRecordBiblecode
			},
			succCallback: function(response) {
				var ajaxData = Ext.decode(response.responseText).data ;
				
				var bibleFields = [] ;
				Ext.Array.each( ajaxData.entry_fields, function(v) {
					if( !v.entry_field_index ) {
						return ;
					}
					
					var mEntryFieldCode = v.entry_field_code ;
					if( mEntryFieldCode.indexOf('field_') == 0 ) {
						mEntryFieldCode = mEntryFieldCode.substr(6) ;
					}
					
					bibleFields.push({
						bible_field_code: mEntryFieldCode,
						bible_field_desc: mEntryFieldCode+': '+v.entry_field_lib
					});
				}) ;
				mTargetCombo.getStore().loadData(bibleFields) ;
			},
			scope: me
		});
	},
			  
	save: function(callback,callbackScope) {
		var me = this ;
		if( !callback ) {
			callback = Ext.emptyFn ;
		}
		
		me.submit({
			params:{ _subaction:'calendarCfg_set' },
			success: callback,
			scope: callbackScope
		}) ;
	},
			  
	load: function() {
		var me = this ;
		
		var arguments = [] ;
		arguments[0] = {
			params:{ _subaction:'calendarCfg_get' },
			success: function() {
				// chargement du formulaire => update layout + chargement de ttes les données auxiliaires
				 // me.calcLayout() ; // Change Event is already fired on "load"
				me.syncDurationFields() ;
			},
			scope: me
		} ;
		
		me.callParent(arguments);
	}
	
	
});
