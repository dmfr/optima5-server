Ext.define('Optima5.Modules.Spec.DbsLam.CfgSocForm',{
	extend:'Optima5.Modules.Spec.DbsLam.CfgForm',
	
	socRecord: null,
	
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
					name: 'soc_code',
					fieldLabel: 'CompanyCode',
					allowBlank: false,
					fieldStyle: 'text-transform:uppercase',
					anchor: '', width: 220
				},{
					xtype: 'textfield',
					name: 'soc_txt',
					allowBlank: false,
					fieldLabel: 'Description'
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
	
	setRecord: function( socRecord ) {
		this.socRecord = socRecord ;
		
		var form = this.down('form').getForm() ;
			  
		var formValues = {
			soc_code: !socRecord.phantom ? socRecord.get('soc_code') : '',
			soc_txt: socRecord.get('soc_txt')
		} ;
		form.setValues(formValues) ;
			  
		this.calcLayout() ;
	},
	
	calcLayout: function() {
		var form = this.down('form').getForm(),
			formValues = form.getValues(false,false,false,true) ;
			 
		form.findField('soc_code').setReadOnly( !this.socRecord.phantom ) ;
	},
	
	handleDismiss: function() {
		if( this.socRecord.phantom ) {
			this.socRecord.erase() ;
		}
	},
	handleSaveRecord: function() {
		var form = this.down('form').getForm(),
			formValues = form.getValues(false,false,false,true) ;
		if( !form.isValid() ) {
			return ;
		}
		
		var recordData = {
			soc_code: formValues.soc_code.replace(' ','').toUpperCase(),
			soc_txt: formValues.soc_txt} ;
		this.socRecord.set(recordData) ;
		this.socRecord.commit() ;
		
		this.fireEvent('saved',this) ;
	}
}) ;