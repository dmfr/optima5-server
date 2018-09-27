Ext.define('Optima5.Modules.Spec.DbsLam.TransferCreateForm',{
	extend:'Ext.panel.Panel',
	
	requires: ['Optima5.Modules.Spec.DbsLam.CfgParamField'],
	
	initComponent: function() {
		Ext.apply(this, {
			title: 'New transfer document',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: '10px 10px',
			border: false,
			layout: {
				type:'hbox',
				align:'stretch'
			},
			items:[{
				itemId: 'pHeader',
				xtype:'component',
				width: 64,
				cls: 'op5-spec-dbspeople-realsummary-box'
			},{
				xtype:'form',
				border: false,
				bodyPadding: '5px 5px',
				bodyCls: 'ux-noframe-bg',
				flex: 1,
				layout: 'anchor',
				fieldDefaults: {
					labelAlign: 'left',
					labelWidth: 80,
					anchor: '100%'
				},
				items:[{
					xtype:'textfield',
					name : 'transfer_txt',
					fieldLabel: 'Doc. Title',
					allowBlank: false
				},Ext.create('Optima5.Modules.Spec.DbsLam.CfgParamField',{
					optimaModule: this.optimaModule,
					name : 'transfer_tpl',
					fieldLabel: 'Transfer Template',
					cfgParam_id: 'TPLTRANSFER',
					allowBlank: false,
					cfgParam_emptyDisplayText: 'Transfer Template'
				})]
			}],
			buttons: [{
				xtype: 'button',
				text: 'OK',
				handler: function( btn ) {
					this.onNewSubmit() ;
				},
				scope: this
			}]
		});
		this.callParent() ;
		if( this.values ) {
			this.down('form').getForm().setValues(this.values) ;
		}
	},
	onNewSubmit: function() {
		var form = this.down('form').getForm() ;
		if( !form.isValid() ) {
			return ;
		}
		var formValues = this.down('form').getForm().getValues(false,false,false,true) ;
		
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'transfer_createDoc',
				data: Ext.JSON.encode(formValues)
			},
			success: function(response) {
				var jsonResponse = Ext.JSON.decode(response.responseText) ;
				if( jsonResponse.success == true ) {
					this.fireEvent('saved') ;
					this.destroy() ;
				}
			},
			callback: function() {
				
			},
			scope: this
		}) ;
	}
}) ;
