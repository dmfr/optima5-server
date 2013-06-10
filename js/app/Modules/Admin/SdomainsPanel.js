Ext.define('AdminSdomainModel',{
	extend: 'Ext.data.Model',
	idProperty: 'sdomain_id',
	fields: [
		{name: 'sdomain_id',  type:'string'},
		{name: 'sdomain_name',  type:'string'},
		{name: 'module_id',    type:'string'},
		{name: 'icon_code',type:'string'},
		{name: 'overwrite_is_locked',type:'boolean'},
		{name: 'stat_nbBibles', type:'int'},
		{name: 'stat_nbFiles', type:'int'},
		{name: 'stat_dbSize', type:'string'}
	]
});

Ext.define('Optima5.Modules.Admin.SdomainsPanel',{
	extend:'Ext.panel.Panel',
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Admin:SdomainsPanel','No module reference ?') ;
		}
		
		Ext.apply(me,{
			layout: 'border',
			items:[{
				xtype: 'gridpanel',
				region: 'center',
				layout: 'fit',
				store: {
					model: 'AdminSdomainModel',
					proxy: me.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_action: 'sdomains_getList'
						},
						reader: {
							type: 'json',
							root: 'data'
						}
					}),
					autoLoad: true
				},
				columns: [{
					text:'',
					width: 20,
					sortable: false,
					dataIndex: 'icon_code',
					menuDisabled: true,
					renderer: function( value, metadata, record )
					{
						metadata.tdCls = Optima5.Helper.getIconsLib().iconGetCls16(value) ;
						metadata.tdCls+= ' background-center-norepeat' ;
					}
				},{
					cls:'op5-admin-column-padlock',
					text:'',
					width: 20,
					sortable: false,
					dataIndex: 'overwrite_is_locked',
					menuDisabled: true,
					renderer: function( value, metadata, record )
					{
						if( value ) {
							metadata.tdCls = 'op5-device-yes'
						} else {
							metadata.tdCls = 'op5-device-no'
						}
					}
				},{
					text: 'Sdomain Id',
					width:100,
					sortable: false,
					dataIndex: 'sdomain_id',
					menuDisabled: true
				},{
					text: 'Description',
					width: 200,
					sortable: false,
					dataIndex: 'sdomain_name',
					menuDisabled: true
				},{
					text: '#Bibles',
					width: 50,
					sortable: false,
					dataIndex: 'stat_nbBibles',
					menuDisabled: true,
					align:'right'
				},{
					text: '#Files',
					width: 50,
					sortable: false,
					dataIndex: 'stat_nbFiles',
					menuDisabled: true,
					align:'right'
				},{
					text: 'Db.Size',
					width: 50,
					sortable: false,
					dataIndex: 'stat_dbSize',
					menuDisabled: true,
					align:'right'
				}],
				listeners: {
					scrollershow: function(scroller) {
						if (scroller && scroller.scrollEl) {
							scroller.clearManagedListeners(); 
							scroller.mon(scroller.scrollEl, 'scroll', scroller.onElScroll, scroller); 
						}
					},
					scope:me
				}
			}]
		});
		
		this.callParent() ;
	}
});