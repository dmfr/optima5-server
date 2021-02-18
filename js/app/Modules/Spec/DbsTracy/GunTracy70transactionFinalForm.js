Ext.define('Optima5.Modules.Spec.DbsTracy.GunTracy70transactionFinalForm',{
	extend:'Ext.form.Panel',
	scrollable: 'vertical',
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
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		
		this.buildForm( this._data ) ;
		
		if( this._data.modal_fields ) {
			this.on('afterrender',function() {
				this.openModal(this._data.modal_fields);
			},this) ;
		}
	},
	onCrmeventBroadcast: function(crmEvent,eventParams) {
		switch( crmEvent ) {
			case 'sign_result' :
				this.getForm().findField('signature_base64').setValue(eventParams.imgJpegBase64) ;
				this.doSubmit() ;
				break ;
		}
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
		
		formItems.push({
			xtype: 'hiddenfield',
			name: 'signature_base64',
			value: ''
		});
		
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
		if( Ext.isEmpty(values.signature_base64) ) { // signature vide
			if( this.optimaModule.postCrmEvent('sign_open',null) === true ) { // Appel du SignaturePad = OK
				return ;
			}
		}
		this.fireEvent('submit',this, values) ;
	},
	doAbort: function() {
		this.fireEvent('back',this) ;
	},
	
	
	
	openModal: function(modal_fields) {
		this.getEl().mask() ;
		
		// Open panel
		var fieldsetItems = [] ;
		Ext.Array.each( modal_fields, function(field) {
			fieldsetItems.push({
				xtype: 'displayfield',
				fieldLabel: field.label,
				value: field.text
			});
		}) ;
		
		var createPanel = Ext.create('Ext.form.Panel',{
			optimaModule: this.optimaModule,
			width:250, // dummy initial size, for border layout to work
			height:null, // ...
			floating: true,
			draggable: true,
			resizable: true,
			renderTo: this.getEl(),
			
			title: 'Partial warning',
			
			bodyPadding: 10,
			bodyCls: 'ux-noframe-bg',
			layout: 'anchor',
			fieldDefaults: {
				labelWidth: 75,
				anchor: '100%'
			},
			items: [{
				xtype: 'fieldset',
				title: 'Informations',
				cls: 'op5-spec-dbstracy-field-narrowline',
				defaults: {
					labelStyle: 'font-weight: bold;'
				},
				items: fieldsetItems
			},{
				xtype: 'container',
				layout: {
					type: 'hbox',
					align: 'center',
					pack: 'middle'
				},
				defaults: {iconAlign: 'top', scale: 'medium', minWidth: this.minButtonWidth, margin: '2px 8px'},
				items: [{
					xtype: 'button',
					icon:'images/op5img/ico_ok_16.gif',
					text: 'Confirm',
					handler: function(btn){
						btn.up('form').destroy();
					}
				},{
					xtype: 'button',
					icon:'images/op5img/ico_reload_small.gif',
					text: 'Back',
					handler: function(btn){
						this.doAbort() ;
					},
					scope: this
				}]
			}]
		});
		
		createPanel.on('destroy',function(p) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		createPanel.show();
		createPanel.getEl().alignTo(this.getEl(), 'c-c?');
		
		this.floatingPanel = createPanel ;
	},
	onDestroy: function() {
		if( this.floatingPanel ) {
			this.floatingPanel.destroy() ;
		}
	}
	
});
