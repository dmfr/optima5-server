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
		
		var bodyCls ;
		var iconCls, title, caption ;
		switch( data.header.result_type ) {
			case 'success' :
			case 'repeat' :
				bodyCls = 'ux-noframe-bg' ;
				iconCls = 'op5-spec-dbstracy-gun-result-ok' ;
				title = 'Scan success' ;
				caption = 'Scanned item has been recorded' ;
				break ;
				
			case 'failure' :
			default :
				bodyCls = '' ;
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
				text: 'Dismiss',
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
	},
	
	doQuit: function() {
		this.fireEvent('quit',this) ;
	}
});
