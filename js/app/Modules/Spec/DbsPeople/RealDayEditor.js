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
					data: Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("ROLE",true)
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
					data: Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("WHSE",true)
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
					data: Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("ABS",true)
				}
			}]
		}) ;
		this.callParent() ;
		this.loadEventRecord( this.eventRecord ) ;
	},
	
	loadEventRecord: function() {
		var eventRecord = this.eventRecord,
			resourceRecord = eventRecord.getResource() ;
		if( eventRecord.get('is_new') ) {
			this.getForm().setValues({event_type: 'ROLE', role_code: resourceRecord.get('std_role_code')}) ;
		} else {
			this.getForm().findField('event_type').setReadOnly(true) ;
			if( eventRecord.get('alt_whse_code') ) {
				this.getForm().setValues({event_type: 'WHSE', alt_whse_code: eventRecord.get('alt_whse_code')}) ;
			} else if( eventRecord.get('is_abs') ) {
				this.getForm().setValues({event_type: 'ABS', abs_code: eventRecord.get('abs_code')}) ;
			} else {
				this.getForm().setValues({event_type: 'ROLE', role_code: eventRecord.get('role_code')}) ;
			}
		}
		
		this.onTypeChange() ;
	},
	
	onTypeChange: function() {
		var form = this.getForm(),
			eventType = form.findField('event_type').getValue() ;
		form.findField('role_code').setVisible(eventType=='ROLE') ;
		form.findField('abs_code').setVisible(eventType=='ABS') ;
		form.findField('alt_whse_code').setVisible(eventType=='WHSE') ;
	},
	
	handleSave: function() {
		
		this.doQuit() ;
	},
	handleDelete: function() {
		this.eventRecord.set('is_delete',true) ;
		this.handleSave() ;
	},
	doQuit: function() {
		this.destroy() ;
	}
}); 
