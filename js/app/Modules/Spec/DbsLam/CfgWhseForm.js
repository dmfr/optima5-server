Ext.define('Optima5.Modules.Spec.DbsLam.CfgWhseForm',{
	extend:'Optima5.Modules.Spec.DbsLam.CfgForm',
	
	whseRecord: null,
	
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
					xtype: 'textfield',
					name: 'whse_code',
					fieldLabel: 'WarehouseCode',
					allowBlank: false,
					fieldStyle: 'text-transform:uppercase',
					anchor: '', width: 220
				},{
					xtype: 'textfield',
					name: 'whse_txt',
					allowBlank: false,
					fieldLabel: 'Site Description'
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
	
	setRecord: function( whseRecord ) {
		this.whseRecord = whseRecord ;
		
		var form = this.down('form').getForm() ;
			  
		var formValues = {
			whse_code: !whseRecord.phantom ? whseRecord.get('whse_code') : '',
			whse_txt: whseRecord.get('whse_txt')
		} ;
		form.setValues(formValues) ;
			  
		this.calcLayout() ;
	},
	
	calcLayout: function() {
		var form = this.down('form').getForm(),
			formValues = form.getValues(false,false,false,true) ;
			 
		form.findField('whse_code').setReadOnly( !this.whseRecord.phantom ) ;
	},
	
	handleDismiss: function() {
		if( this.whseRecord.phantom ) {
			this.whseRecord.erase() ;
		}
	},
	handleSaveRecord: function() {
		var form = this.down('form').getForm(),
			formValues = form.getValues(false,false,false,true) ;
		if( !form.isValid() ) {
			return ;
		}
		
		var recordData = {
			whse_code: formValues.whse_code.replace(' ','').toUpperCase(),
			whse_txt: formValues.whse_txt} ;
		this.whseRecord.set(recordData) ;
		this.whseRecord.commit() ;
		
		this.fireEvent('saved',this) ;
	}
}) ;