Ext.define('AuthDelegateBibleFieldModel', {
	extend: 'Ext.data.Model',
	idProperty: 'field_code',
	fields: [
		{name: 'field_code',  type: 'string'},
		{name: 'field_lib',  type: 'string'},
		{
			name: 'field_desc',
			type: 'string',
			convert: function(v,rec) {
				return rec.data.field_code + ' :: ' + rec.data.field_lib
			}
		}
	]
});
Ext.define('AuthDelegateBibleModel', {
	extend: 'Ext.data.Model',
	idProperty: 'bible_code',
	fields: [
		{name: 'bible_code',  type: 'string'},
		{name: 'bible_lib',  type: 'string'},
		{
			name: 'bible_desc',
			type: 'string',
			convert: function(v,rec) {
				return rec.data.bible_code + ' :: ' + rec.data.bible_lib
			}
		}
	],
	hasMany: [{
		model: 'AuthDelegateBibleFieldModel',
		name: 'bible_fields',
		associationKey: 'bible_fields'
	}]
});


Ext.define('Optima5.Modules.CrmBase.AuthDelegateForm' ,{
	extend: 'Ext.form.Panel',
			  
	requires: ['Ext.ux.dams.ComboBoxCached'] ,
			 
	layout: 'anchor',
	fieldDefaults: {
		labelAlign: 'left',
		labelWidth: 75
	},

			  
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:AuthDelegateForm','No module reference ?') ;
		}
		
		this.biblesStore = Ext.create('Ext.data.Store',{
			model: 'AuthDelegateBibleModel',
			data: [],
			proxy: {
				type: 'memory' ,
				reader: {
					type: 'json'
				}
			}
		}) ;
		
		Ext.apply(me,{
			padding: 5,
			border: false,
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 5,
			defaults: {
				anchor: '100%'
			},
			items:[{
				xtype:'fieldset',
				title: 'Delegate enabled',
				checkboxToggle: true,
				checkboxName: 'authdelegate_is_on',
				defaults: {
					anchor: '100%',
					labelWidth: 100
				},
				items: [{
					xtype: 'comboboxcached',
					name: 'authdelegate_bible_code',
					fieldLabel: 'Source bible',
					forceSelection:true,
					allowBlank:false,
					editable:false,
					queryMode: 'local',
					displayField: 'bible_desc',
					valueField: 'bible_code',
					store: this.biblesStore
				},{
					xtype: 'comboboxcached',
					name: 'authdelegate_user_bible_field_code',
					fieldLabel: 'User field',
					labelAlign: 'right',
					forceSelection:true,
					allowBlank:false,
					editable:false,
					queryMode: 'local',
					displayField: 'field_desc',
					valueField: 'field_code',
					store: {
						model: 'AuthDelegateBibleFieldModel',
						data: []
					}
				},{
					xtype: 'comboboxcached',
					name: 'authdelegate_pass_bible_field_code',
					fieldLabel: 'Password field',
					labelAlign: 'right',
					forceSelection:true,
					allowBlank:false,
					editable:false,
					queryMode: 'local',
					displayField: 'field_desc',
					valueField: 'field_code',
					store: {
						model: 'AuthDelegateBibleFieldModel',
						data: []
					}
				}]
			}],
			buttons:[{
				text: 'Save Config',
				handler: function() {
					this.doSave() ;
				},
				scope: this
			}]
		});
		
		this.callParent() ;
		this.getForm().getFields().each(function(field) {
			field.on('change',function(){
				if( this._suspended ) {
					return ;
				}
				me.evalForm() ;
			},me) ;
		},me) ;
		
		this.doLoad();
	},
	
	evalForm: function() {
		var form = this.getForm(),
			bibleCombo = form.findField('authdelegate_bible_code'),
			bibleCode = bibleCombo.getValue(),
			bibleRecord = this.biblesStore.getById(bibleCode),
			userCombo = form.findField('authdelegate_user_bible_field_code'),
			passCombo = form.findField('authdelegate_pass_bible_field_code'),
			storeToSet, storeData,
			doShow ;
		if( Ext.isEmpty(bibleRecord) ) {
			storeData = [] ;
			doShow = false ;
		} else {
			storeToSet = bibleRecord.bible_fields() ;
			storeData = Ext.pluck( storeToSet.getRange(), 'data' ) ;
			doShow = true ;
		}
		userCombo.setVisible(doShow) ;
		userCombo.getStore().loadRawData(storeData) ;
		passCombo.setVisible(doShow) ;
		passCombo.getStore().loadRawData(storeData) ;
	},
	
	doLoad: function() {
		var moduleDescRecord = this.optimaModule.getModuleDescRecord() ;
		if( moduleDescRecord.get('parentModuleId') != 'crmbase' ) {
			this.doDisableAll() ;
			return ;
		}
		
		this.showLoadmask() ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: 'auth_delegate_getConfig'
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					this._suspended = true ;
					this.getForm().setValues(jsonResponse.formData) ;
					this._suspended = false ;
					this.biblesStore.loadRawData( jsonResponse.biblesStore ) ;
					this.evalForm() ;
					this.getForm().isValid() ;
				} else {
					this.doDisableAll() ;
				}
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	doSave: function() {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: 'auth_delegate_setConfig',
				formData: Ext.JSON.encode(this.getForm().getValues())
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					this.up('window').destroy() ;
				} else {
					Ext.MessageBox.alert('Problem','Invalid / incomplete') ;
				}
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	doDisableAll: function() {
		this.down('fieldset').setVisible(false) ;
		this.down('button').setVisible(false) ;
	},
	
			  
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		this.show() ; // HACK?
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	}
});