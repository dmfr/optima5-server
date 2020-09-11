Ext.define('Optima5.Modules.Spec.DbsTracy.GunTracy70example',{
	extend:'Ext.form.Panel',
	
	initComponent: function(){
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: "0 10px",
			layout: 'anchor',
			fieldDefaults: {
				labelWidth: 90,
				anchor: '100%'
			},
			items: [Ext.create('Optima5.Modules.Spec.DbsTracy.GunFormHeader',{
				padding: '0px 0px 16px 0px',
				width:'100%',
				data:{
					iconCls:'op5-sdomains-icon-delete',
					title: 'Delete Sdomain',
					caption: 'Permanently delete all associated data'
				}
			}),{
				xtype: 'fieldset',
				title: 'Informations',
				cls: 'op5-spec-dbstracy-field-narrowline',
				items: [{
					xtype: 'displayfield',
					fieldLabel: 'Ghuiiuhuhihu',
					value: 'MBD/1564484848994'
				},{
					xtype: 'displayfield',
					fieldLabel: 'Ghuiiuhuhihu',
					value: 'MBD/1564484848994'
				},{
					xtype: 'displayfield',
					fieldLabel: 'Ghuiiuhuhihu',
					value: 'MBD/1564484848994'
				},{
					xtype: 'displayfield',
					fieldLabel: 'Ghuiiuhuhihu',
					value: 'MBD/1564484848994'
				},{
					xtype: 'displayfield',
					fieldLabel: 'Ghuiiuhuhihu',
					value: 'MBD/1564484848994'
				},{
					xtype: 'displayfield',
					fieldLabel: 'Ghuiiuhuhihu',
					value: 'MBD/1564484848994'
				}]
			}]
		});
		
		this.callParent() ;
	}
});
