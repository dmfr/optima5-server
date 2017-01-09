Ext.define('Optima5.Modules.Spec.DbsPeople.RealDayEditor', {
	
	extend: 'Ext.form.Panel',
	 
	initComponent: function() {
		Ext.apply(this,{
			layout: 'anchor',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 10,
			fieldDefaults: {
				labelWidth: 75,
				anchor: '100%'
			},
			items: [{
				xtype: 'colorcombo',
				allowBlank: false,
				queryMode: 'local',
				forceSelection: true,
				editable: false,
				displayField: 'eventType_txt',
				valueField: 'eventType_code',
				iconClsField: 'eventType_iconCls',
				store: {
					fields: ['eventType_code','eventType_txt','eventType_iconCls'],
					data : [
						{eventType_code:'ROLE',eventType_txt:'Rôle',eventType_iconCls:'op5-spec-dbspeople-icon-role'},
						{eventType_code:'WHSE',eventType_txt:'Chgmt Entrepôt',eventType_iconCls:'op5-spec-dbspeople-icon-move'},
						{eventType_code:'ABS',eventType_txt:'Absence',eventType_iconCls:'op5-spec-dbspeople-icon-absence'}
					]
				},
				fieldLabel: 'Catégorie',
				name : 'event_type',
				itemId : 'event_type',
				listeners: {
					change: function() {
						this.onTypeChange() ;
					},
					scope: this
				}
			},{
				xtype:'combobox',
				itemId: 'cliCombobox',
				matchFieldWidth:false,
				listConfig:{width:250},
				forceSelection:true,
				allowBlank:false,
				editable:true,
				typeAhead:true,
				selectOnFocus: true,
				queryMode: 'local',
				displayField: 'text',
				valueField: 'id',
				fieldLabel: 'Client',
				name: 'cli_code' ,
				store: {
					fields:['id','text'],
					data: []
				}
			},{
				xtype:'combobox',
				itemId: 'roleCombobox',
				matchFieldWidth:false,
				listConfig:{width:250},
				forceSelection:true,
				allowBlank:false,
				editable:true,
				typeAhead:true,
				selectOnFocus: true,
				queryMode: 'local',
				displayField: 'text',
				valueField: 'id',
				fieldLabel: 'Role',
				name: 'role_code' ,
				store: {
					fields:['id','text'],
					data: []
				}
			},{
				xtype:'combobox',
				itemId: 'whseCombobox',
				matchFieldWidth:false,
				listConfig:{width:250},
				forceSelection:true,
				allowBlank:false,
				editable:true,
				typeAhead:true,
				selectOnFocus: true,
				queryMode: 'local',
				displayField: 'text',
				valueField: 'id',
				fieldLabel: 'To Warehouse',
				name: 'alt_whse_code' ,
				store: {
					fields:['id','text'],
					data: []
				}
			},{
				xtype:'combobox',
				itemId: 'absCombobox',
				matchFieldWidth:false,
				listConfig:{width:250},
				forceSelection:true,
				allowBlank:false,
				editable:true,
				typeAhead:true,
				selectOnFocus: true,
				queryMode: 'local',
				displayField: 'text',
				valueField: 'id',
				fieldLabel: 'Absence',
				name: 'abs_code' ,
				store: {
					fields:['id','text'],
					data: []
				}
			}]
		}) ;
		this.callParent() ;
		this.loadEventRecord( this.eventRecord ) ;
	},
	
	loadEventRecord: function() {
		var eventRecord = this.eventRecord,
			resourceRecord = eventRecord.getResource(),
			whseCode = resourceRecord.get('whse_code'),
			form = this.getForm() ;
			
		form.findField('cli_code').getStore().loadData( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll_linkWhse( "CLI", whseCode )) ;
		form.findField('role_code').getStore().loadData( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll_linkWhse("ROLE", whseCode )) ;
		form.findField('alt_whse_code').getStore().loadData( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll_linkWhse("WHSE", whseCode )) ;
		form.findField('abs_code').getStore().loadData( Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("ABS",true) ) ;
		
			
		if( eventRecord.get('is_new') ) {
			this.getForm().setValues({
				event_type: 'ROLE',
				role_code: resourceRecord.get('std_role_code'),
				cli_code: Optima5.Modules.Spec.DbsPeople.HelperCache.links_cli_getDefaultForWhse( resourceRecord.get('whse_code') )
			}) ;
		} else {
			this.getForm().findField('event_type').setReadOnly(true) ;
			if( eventRecord.get('alt_whse_code') ) {
				this.getForm().setValues({event_type: 'WHSE', alt_whse_code: eventRecord.get('alt_whse_code')}) ;
			} else if( eventRecord.get('is_abs') ) {
				this.getForm().setValues({event_type: 'ABS', abs_code: eventRecord.get('abs_code')}) ;
			} else {
				this.getForm().setValues({
					event_type: 'ROLE',
					role_code: eventRecord.get('role_code'),
					cli_code: eventRecord.get('cli_code')
				}) ;
			}
		}
		
		this.onTypeChange() ;
	},
	
	onTypeChange: function() {
		var form = this.getForm(),
			eventType = form.findField('event_type').getValue() ;
		form.findField('cli_code').setVisible(eventType=='ROLE') ;
		form.findField('cli_code').allowBlank = !(eventType=='ROLE') ;
		form.findField('role_code').setVisible(eventType=='ROLE') ;
		form.findField('role_code').allowBlank = !(eventType=='ROLE') ;
		form.findField('abs_code').setVisible(eventType=='ABS') ;
		form.findField('abs_code').allowBlank = !(eventType=='ABS') ;
		form.findField('alt_whse_code').setVisible(eventType=='WHSE') ;
		form.findField('alt_whse_code').allowBlank = !(eventType=='WHSE') ;
	},
	
	handleSave: function() {
		this.eventRecord.set('is_new',false) ;
		this.eventRecord.set('is_delete',false) ;
		var form = this.getForm(),
			formValues = form.getValues(false,false,false,true) ;
		if( !form.isValid() ) {
			return ;
		}
		switch( formValues.event_type ) {
			case 'ROLE' :
				this.eventRecord.set('cli_code',formValues.cli_code) ;
				this.eventRecord.set('role_code',formValues.role_code) ;
				this.eventRecord.set('is_abs',false) ;
				break ;
			case 'ABS' :
				this.eventRecord.set('abs_code',formValues.abs_code) ;
				this.eventRecord.set('is_abs',true) ;
				break ;
			case 'WHSE' :
				this.eventRecord.set('is_abs',false) ;
				this.eventRecord.set('alt_whse_code',formValues.alt_whse_code) ;
				break ;
		}
		
		this.doQuit() ;
	},
	handleDelete: function(doIt) {
		if( !doIt && !this.eventRecord.get('is_new') ) {
			Ext.MessageBox.confirm('Confirm', 'Delete segment ?', function(buttonStr) {
				if( buttonStr!='yes' ) {
					return ;
				}
				this.handleDelete(true) ;
			},this) ;
			return ;
		}
		this.eventRecord.set('is_delete',true) ;
		this.doQuit() ;
	},
	doQuit: function() {
		this.destroy() ;
	}
}); 
