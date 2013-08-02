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
		{name: 'stat_dbSize', type:'string'},
		{name: 'sdomain_id_forDisplay',  type:'string', convert:function(v,record){return record.getId().toUpperCase();}}
	]
});

Ext.define('Optima5.Modules.Admin.SdomainsPanel',{
	extend:'Ext.panel.Panel',
	
	requires:['Optima5.Modules.Admin.SdomainsForm'],
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Admin:SdomainsPanel','No module reference ?') ;
		}
		
		Ext.apply(me,{
			layout: 'border',
			items:[{
				xtype: 'gridpanel',
				itemId: 'mSdomainsList',
				region: 'center',
				layout: 'fit',
				border:false,
				tbar:[{
					iconCls:'op5-sdomains-menu-new',
					text:'Create Sdomain',
					handler: function() {
						me.setFormpanelRecord(null) ;
					},
					scope:me
				}],
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
					dataIndex: 'sdomain_id_forDisplay',
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
					width: 65,
					sortable: false,
					dataIndex: 'stat_dbSize',
					menuDisabled: true,
					align:'right'
				}],
				listeners: {
					itemclick:function( view, record, item, index, event ) {
						me.setFormpanelRecord( record ) ;
					},
					scope:me
				}
			},{
				region:'east',
				xtype: 'panel',
				layout:'fit',
				width: 400,
				itemId:'mSdomainsFormContainer',
				title: '',
				collapsible:true,
				collapsed: true,
				empty:true,
				listeners:{
					beforeexpand:function(eastpanel) {
						if( eastpanel.empty ) {
							return false;
						}
					},
					scope:me
				}
			}]
		});
		
		this.callParent() ;
		
		me.mon(me.optimaModule,'op5broadcast',me.onCrmeventBroadcast,me) ;
	},
	onCrmeventBroadcast: function( crmEvent, eventParams ) {
		var me = this ;
		switch( crmEvent ) {
			case 'sdomainchange' :
				return me.endFormpanelAction() ;
		}
	},
	
	setFormpanelRecord: function( record ) {
		var me = this,
			mformcontainer = me.getComponent('mSdomainsFormContainer'),
			mform = mformcontainer.getComponent('mSdomainsForm') ;
		
		if( mform != null ) {
			if( record != null ) {
				if( record.getId() == mform.sdomainId ) {
					mformcontainer.expand(false) ;
					return ;
				}
			} else {
				if( mform.isNew ) {
					mformcontainer.expand(false) ;
					return ;
				}
			}
		}
		
		
		mform = Ext.create('Optima5.Modules.Admin.SdomainsForm',{
			border:false,
			itemId:'mSdomainsForm',
			optimaModule: me.optimaModule
		}) ;
		mform.loadRecord(record) ;
		
		var strTitle = ( record == null ? 'New Sdomain' : record.get('sdomain_id')+' : '+record.get('sdomain_name') ) ;
		mformcontainer.setTitle( strTitle ) ;
		mformcontainer.empty = false ;
		mformcontainer.removeAll() ;
		mformcontainer.add(mform) ;
		mformcontainer.expand(false) ;
	},
	endFormpanelAction: function() {
		var me = this,
			mformcontainer = me.getComponent('mSdomainsFormContainer') ;
		
		// ** Clear du formpanel ***
		mformcontainer.removeAll() ;
		mformcontainer.setTitle('') ;
		mformcontainer.collapse(false) ;
		mformcontainer.empty = true ;
		
		// ** Reload list ***
		me.getComponent('mSdomainsList').getStore().load() ;
		
		// ** Refresh desktop ***
		me.optimaModule.app.desktopReloadSdomains() ;
	}
});