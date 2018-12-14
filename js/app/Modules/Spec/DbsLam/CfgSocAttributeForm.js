Ext.define('Optima5.Modules.Spec.DbsLam.CfgSocAttributeForm',{
	extend:'Optima5.Modules.Spec.DbsLam.CfgForm',
	
	socRecord: null,
	atrRecord: null,
	
	initComponent: function() {
		Ext.apply( this, {
			border: false,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			tbar:[{
				iconCls:'op5-sdomains-menu-submit',
				text:'Save',
				handler: function() {
					this.handleSaveRecord() ;
				},
				scope:this
			}],
			items: [{
				flex: 1,
				xtype: 'form',
				layout: 'anchor',
				fieldDefaults: {
					labelAlign: 'left',
					labelWidth: 135,
					anchor: '100%'
				},
				frame:false,
				border: false,
				autoScroll: true,
				bodyPadding: 10,
				bodyCls: 'ux-noframe-bg',
				items: [{
					xtype: 'displayfield',
					name: 'soc_display',
					fieldLabel: 'Company'
				},{
					xtype: 'textfield',
					name: 'atr_code',
					fieldLabel: 'AttributeCode',
					allowBlank: false,
					fieldStyle: 'text-transform:uppercase',
					anchor: '', width: 220
				},{
					xtype: 'textfield',
					name: 'atr_txt',
					allowBlank: false,
					fieldLabel: 'Description'
				},{
					xtype: 'fieldset',
					cls: 'op5-spec-dbslam-fieldset',
					title: 'Source / Primary Key',
					defaults: {
						margin: 2,
						fieldBodyCls: '' // Otherwise height would be set at 22px
					},
					items: [{
						xtype: 'combobox',
						name: 'use',
						fieldLabel: 'Link to',
						forceSelection: true,
						editable: false,
						allowBlank: false,
						store: {
							fields: ['id','lib'],
							data : [
								{id:'PROD', lib:'Products'},
								{id:'STOCK', lib:'Stock units'},
								{id:'CDE', lib:'Orders'}
							]
						},
						queryMode: 'local',
						displayField: 'lib',
						valueField: 'id'
					},{
						xtype:'checkboxfield',
						fieldLabel: 'Allow multiple values',
						name: 'use_multi'
					},{
						xtype:'checkboxfield',
						fieldLabel: 'Editable ?',
						name: 'cfg_is_editable'
					},{
						xtype:'checkboxfield',
						fieldLabel: 'Text only ?',
						name: 'is_bible_false'
					}]
				},{
					xtype: 'fieldset',
					itemId: 'fsAdr',
					cls: 'op5-spec-dbslam-fieldset',
					checkboxName: 'adr_use',
					checkboxToggle: true,
					title: 'Forward to Stock Locations',
					defaults: {
						margin: 2,
						fieldBodyCls: '' // Otherwise height would be set at 22px
					},
					items: [{
						xtype:'checkboxfield',
						fieldLabel: 'Multi-values / Location',
						name: 'adr_use_multi'
					},{
						xtype: 'combobox',
						name: 'adr_is_optional',
						fieldLabel: 'Mode',
						forceSelection: true,
						editable: false,
						allowBlank: true,
						store: {
							fields: ['id','lib'],
							data : [
								{id:'N', lib:'Strict match'},
								{id:'Y', lib:'Prefered match'}
							]
						},
						queryMode: 'local',
						displayField: 'lib',
						valueField: 'id'
					},{
						xtype:'checkboxfield',
						fieldLabel: 'Monitor for mismatch',
						name: 'adr_is_mismatch'
					}]
				}]
			}]
		}) ;
		
		this.callParent() ;
		
		this.down('form').getForm().getFields().each(function(field) {
			field.on('change',function(field){
				if( field.getXType() == 'textfield' ) {
					return ;
				}
				this.calcLayout() ;
			},this) ;
		},this) ;
	},
	
	setRecord: function( socRecord, atrRecord ) {
		this.socRecord = socRecord ;
		this.atrRecord = atrRecord ;
		
		var form = this.down('form').getForm() ;
			  
		var formValues = {
			soc_display: '<b>' + socRecord.get('soc_code') + '</b> - ' + socRecord.get('soc_txt'),
			atr_code: !atrRecord.phantom ? atrRecord.get('atr_code') : '',
			atr_txt: atrRecord.get('atr_txt'),
			use: atrRecord.get('use_prod') ? 'PROD' : atrRecord.get('use_stock') ? 'STOCK' : atrRecord.get('use_cde') ? 'CDE' : null,
			use_multi: atrRecord.get('use_prod_multi') || atrRecord.get('use_stock_multi'),
			cfg_is_editable: atrRecord.get('cfg_is_editable'),
			is_bible_false: !(atrRecord.get('is_bible')),
			adr_use: atrRecord.get('use_adr'),
			adr_use_multi: atrRecord.get('use_adr_multi'),
			adr_is_optional: atrRecord.get('adr_is_optional') ? 'Y' : 'N',
			adr_is_mismatch: atrRecord.get('adr_is_mismatch')
		} ;
		form.setValues(formValues) ;
			  
		this.calcLayout() ;
	},
	
	calcLayout: function() {
		var form = this.down('form').getForm(),
			formValues = form.getValues(false,false,false,true) ;
			 
		form.findField('atr_code').setReadOnly( !this.atrRecord.phantom ) ;
		
		form.findField('use_multi').setVisible( formValues.use == 'PROD' ) ;
		form.findField('cfg_is_editable').setVisible( formValues.use == 'PROD' ) ;
		form.findField('is_bible_false').setVisible( true ) ;
		
		var useAdr = true ;
		if( formValues.is_bible_false ) {
			useAdr = false ;
		}
		this.down('#fsAdr').setVisible( useAdr ) ;
	},
	
	handleDismiss: function() {
		if( this.atrRecord.phantom ) {
			this.atrRecord.erase() ;
		}
	},
	handleSaveRecord: function() {
		var form = this.down('form').getForm(),
			formValues = form.getValues(false,false,false,true) ;
		if( !form.isValid() ) {
			return ;
		}
		
		var recordData = {
			atr_code: formValues.atr_code.replace(' ','').toUpperCase(),
			atr_txt: formValues.atr_txt,
			is_bible: !formValues.is_bible_false,
			use_prod: formValues.use == 'PROD',
			use_prod_multi: (formValues.use == 'PROD' && formValues.use_multi),
			use_stock: formValues.use == 'STOCK',
			use_cde: formValues.use == 'CDE',
			cfg_is_hidden: false,
			cfg_is_editable: formValues.cfg_is_editable,
			use_adr: formValues.adr_use,
			use_adr_multi: (formValues.adr_use && formValues.adr_use_multi),
			adr_is_optional:(formValues.adr_use && formValues.adr_is_optional=='Y'),
			adr_is_mismatch: (formValues.adr_use && formValues.adr_is_mismatch)
		} ;
		this.atrRecord.set(recordData) ;
		this.atrRecord.commit() ;
		
		this.fireEvent('saved',this) ;
	}
}) ;
