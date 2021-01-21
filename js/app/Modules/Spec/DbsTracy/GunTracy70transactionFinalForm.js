Ext.define('Optima5.Modules.Spec.DbsTracy.GunTracy70transactionFinalForm',{
	extend:'Ext.form.Panel',
	requires: ['Optima5.Modules.Spec.DbsTracy.GunFormHeader'],
	
	initComponent: function(){
		Ext.apply(this,{
			bodyPadding: 4,
			bodyCls: 'ux-noframe-bg',
			layout: 'anchor',
			fieldDefaults: {
				labelWidth: 90,
				anchor: '100%'
			},
			items: []
		});
		
		this.callParent() ;
		
		this.buildForm( this._data ) ;
	},
	
	buildForm: function(data) {
		var formItems = [] ;
		
		formItems.push( Ext.create('Optima5.Modules.Spec.DbsTracy.GunFormHeader',{
			padding: '0px 0px 8px 0px',
			width:'100%',
			data:{
				title: 'Create manifest',
				iconCls: 'op5-spec-dbstracy-gun-result-ok',
				caption: 'Specify transport details'
			}
		}) );
		
		if( true ) {
			formItems.push({
				xtype: 'fieldset',
				title: 'Informations',
				cls: 'op5-spec-dbstracy-field-narrowline',
				defaults: {
					labelStyle: 'font-weight: bold;',
					labelAlign: 'top',
					allowBlank: false
				},
				items: [{
					xtype: 'textfield',
					name: 'atr_name',
					fieldLabel: 'Driver name'
				},{
					xtype: 'textfield',
					name: 'atr_lplate',
					fieldLabel: 'License plate'
				}]
			});
		}
		
		if( !Ext.isEmpty(data.fields) ) {
			var fieldsetItems = [] ;
			Ext.Array.each( data.fields, function(field) {
				fieldsetItems.push({
					xtype: 'displayfield',
					fieldLabel: field.label,
					value: field.text
				});
			}) ;
			formItems.push( {
				xtype: 'fieldset',
				title: 'Informations',
				cls: 'op5-spec-dbstracy-field-narrowline',
				defaults: {
					labelStyle: 'font-weight: bold;'
				},
				items: fieldsetItems
			} );
		}
		
		
		this.removeAll() ;
		this.add(formItems) ;
		
		// Bottom btn
		this.add({
			xtype: 'container',
			padding: 6,
			layout: {
				type: 'hbox',
				pack: 'center'
			},
			items: [{
				xtype: 'button',
				scale: 'large',
				style: 'min-width: 100px',
				text: 'Submit',
				listeners: {
					click: function() {
						this.doSubmit() ;
					},
					scope: this
				}
			},{
				xtype: 'box',
				width: 16
			},{
				xtype: 'button',
				scale: 'large',
				style: 'min-width: 100px',
				text: 'Back',
				listeners: {
					click: function() {
						this.doAbort() ;
					},
					scope: this
				}
			}]
		});
		
	},
	
	doSubmit: function() {
		var form = this.getForm() ;
		if( !form.isValid() ) {
			return ;
		}
		var values = form.getValues() ;
		this.fireEvent('submit',this, values) ;
	},
	doAbort: function() {
		this.fireEvent('back',this) ;
	}
});
