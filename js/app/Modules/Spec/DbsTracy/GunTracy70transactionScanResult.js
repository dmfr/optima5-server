Ext.define('Optima5.Modules.Spec.DbsTracy.GunTracy70transactionScanResult',{
	extend:'Ext.form.Panel',
	requires: ['Optima5.Modules.Spec.DbsTracy.GunFormHeader'],
	
	initComponent: function(){
		Ext.apply(this,{
			bodyPadding: 4,
			layout: 'anchor',
			fieldDefaults: {
				labelWidth: 90,
				anchor: '100%'
			},
			items: []
		});
		
		this.callParent() ;
		
		this.buildForm( this._data ) ;
		
		Ext.defer( function(){
			//this.doQuit() ;
		},2000,this) ;
	},
	
	buildForm: function(data) {
		var formItems = [] ;
		
		var deferQuit = false ;
		
		var bodyCls ;
		var iconCls, title, caption ;
		switch( data.header.result_type ) {
			case 'final' :
				bodyCls = 'ux-noframe-bg' ;
				iconCls = 'op5-spec-dbstracy-gun-result-ok' ;
				title = 'Manifest saved' ;
				caption = 'End of transaction' ;
				deferQuit = false ;
				break ;
				
			case 'success' :
				bodyCls = 'ux-noframe-bg' ;
				iconCls = 'op5-spec-dbstracy-gun-result-ok' ;
				title = 'Scan success' ;
				caption = 'Scanned item has been recorded' ;
				deferQuit = true ;
				break ;
				
			case 'repeat' :
				bodyCls = 'ux-noframe-bg-alert' ;
				iconCls = 'op5-spec-dbstracy-gun-result-ok' ;
				title = 'Scan duplicate' ;
				caption = 'Scanned item already recorded' ;
				deferQuit = false ;
				break ;
				
			case 'failure' :
			default :
				bodyCls = 'ux-noframe-bg-alert' ;
				iconCls = 'op5-spec-dbstracy-gun-result-fail' ;
				title = 'Scan rejected' ;
				caption = 'Error on scan, see below reason' ;
				break ;
		}
		formItems.push( Ext.create('Optima5.Modules.Spec.DbsTracy.GunFormHeader',{
			padding: '0px 0px 16px 0px',
			width:'100%',
			data:{
				iconCls:iconCls,
				title: title,
				caption: caption
			}
		}) );
		
		if( !Ext.isEmpty(data.primary_key) ) {
			formItems.push( {
				xtype: 'hiddenfield',
				name: data.primary_key.name,
				value: data.primary_key.value
			} );
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
		
		if( data.reason ) {
			formItems.push({
				xtype: 'fieldset',
				title: 'Reason',
				items: [{
					xtype: 'box',
					padding: 6,
					html: Ext.util.Format.nl2br( data.reason )
				}]
			});
		}
		
		if( bodyCls ) {
			this.addBodyCls(bodyCls) ;
		}
		this.removeAll() ;
		this.add(formItems) ;
		
		// Bottom btn
		switch( data.header.result_type ) {
			case 'repeat' :
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
						text: 'Ok',
						listeners: {
							click: function() {
								this.doQuit() ;
							},
							afterrender: function(btn) {
								btn.focus() ;
							},
							scope: this
						}
					},{
						xtype: 'box',
						width: 8
					},{
						xtype: 'button',
						scale: 'large',
						style: 'min-width: 100px',
						text: 'Eject',
						listeners: {
							click: function() {
								this.doAfterAction('eject') ;
							},
							scope: this
						}
					}]
				});
				break ;
			default :
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
						text: 'Next',
						listeners: {
							click: function() {
								this.doQuit() ;
							},
							afterrender: function(btn) {
								btn.focus() ;
							},
							scope: this
						}
					}]
				});
				break ;
		}
		
		if( deferQuit ) {
			Ext.defer( function(){
				this.doQuit() ;
			},2000,this) ;
		}
	},
	
	doAfterAction: function(afterAction) {
		this.fireEvent('afteraction',this, afterAction) ;
	},
	doQuit: function() {
		this.fireEvent('quit',this) ;
	}
});
