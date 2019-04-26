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
				},{
					xtype: 'fieldset',
					cls: 'op5-spec-dbslam-fieldset',
					title: 'Location policy',
					defaults: {
						xtype: 'radiofield',
						name: 'location_policy_ifexists',
						margin: 2,
						fieldBodyCls: '' // Otherwise height would be set at 22px
					},
					items: [
						{ boxLabel: 'New location for items', inputValue: 'NONE' },
						{ boxLabel: 'Same P/N', inputValue: 'PN'},
						{ boxLabel: 'Same P/N + batch', inputValue: 'PN_BATCH' }
 					]
				},{
					xtype: 'fieldset',
					cls: 'op5-spec-dbslam-fieldset',
					title: 'P/N attributes',
					items: [{
						xtype: 'checkboxfield',
						name: 'prodspec_is_batch',
						boxLabel: 'Spec. Batch'
					},{
						xtype: 'checkboxfield',
						name: 'prodspec_is_dlc',
						boxLabel: 'Date expire / DLUO'
					},{
						xtype: 'checkboxfield',
						name: 'prodspec_is_sn',
						boxLabel: 'Serial number'
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
	
	setRecord: function( socRecord ) {
		this.socRecord = socRecord ;
		
		var form = this.down('form').getForm() ;
			  
		var formValues = {
			soc_code: !socRecord.phantom ? socRecord.get('soc_code') : '',
			soc_txt: socRecord.get('soc_txt'),
			prodspec_is_batch: socRecord.get('prodspec_is_batch'),
			prodspec_is_dlc: socRecord.get('prodspec_is_dlc'),
			prodspec_is_sn: socRecord.get('prodspec_is_sn'),
			location_policy_ifexists: socRecord.get('location_policy_ifexists')
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
			soc_txt: formValues.soc_txt,
			prodspec_is_batch: formValues.prodspec_is_batch,
			prodspec_is_dlc: formValues.prodspec_is_dlc,
			prodspec_is_sn: formValues.prodspec_is_sn,
			location_policy_ifexists: formValues.location_policy_ifexists
		} ;
		this.socRecord.set(recordData) ;
		this.socRecord.commit() ;
		
		this.fireEvent('saved',this) ;
	}
}) ;
