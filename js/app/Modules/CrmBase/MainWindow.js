Ext.define('Optima5.Modules.CrmBase.MainWindow',{
	extend:'Ext.window.Window',
	requires:[
		'Optima5.Modules.CrmBase.MainWindowButton',
		'Optima5.Modules.CrmBase.AuthAndroidPanel'
	],
	
	initComponent: function() {
		var me = this ;
		Ext.apply(me,{
			width:250,
			height:600,
			resizable:false,
			maximizable:false,
			layout:'fit',
			items:[{
				xtype:'toolbar',
				vertical:true,
				layout:{
					align:'stretch'
				},
				defaults:{
					xtype:'op5paracrmmwbutton',
					scale:'large',
					textAlign:'left',
					width:300,
					menuAlign:'tl-tr?'
				},
				items:[{
					textTitle: 'Bible Library',
					textCaption: 'Bible',
					icon: 'images/op5img/ico_dataadd_16.gif',
				},{
					textTitle: 'Data Files',
					textCaption: 'Bible',
					icon: 'images/op5img/ico_showref_listall.gif',
				},{
					textTitle: 'Scenarios',
					//textCaption: 'Bible',
					icon: 'images/op5img/ico_engins_16.gif',
					//menu: this.createScenariosMenu()
					menu: {
						xtype:'menu',
						plain:true,
						items:[{
							text: 'Scenarios',
							icon: 'images/op5img/ico_engins_16.gif',
						}]
					}
				},{
					textTitle: 'Queries / Qmerge',
					textCaption: 'Bible',
					icon: 'images/op5img/ico_blocs_small.gif',
				},{
					icon: 'images/op5img/ico_kuser_small.gif',
					textTitle: 'Administration',
					textCaption: 'User accounts / Devices',
					menu: {
						xtype: 'menu',
						plain: true,
						items: [{
							text: 'ParaCRM accounts',
							icon: 'images/op5img/ico_kuser_small.gif',
							handler : function(){
								//console.dir(op5session) ;
								//console.log('Session ID is ' + op5session.get('sessionID')) ;
							}
						},{
							text: 'Android devices',
							icon: 'images/op5img/ico_android_16.png',
							handler : function(){
								this.switchToAuth('AuthAndroid') ;
							},
							scope:this
						}]
					}
				}]
			}]
		}) ;
		
		me.on('afterrender',function(){
			var totHeight = 0 ;
			Ext.Array.each(me.child('toolbar').query('>button'),function(item) {
				totHeight += item.getHeight() ;
			},me) ;
			me.setHeight(totHeight+50) ;
		},me);
		
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action : 'define_getMainToolbar',
				data_type : 'file'
			},
			callback: function() {
			},
			success: function() {
			}
		});
		
		
		me.on('ready',function(){
			me.testFn() ;
		},me) ;
		
		this.callParent() ;
	},
	testFn: function() {
		var me = this ;
		var win = me.optimaModule.createWindow({
			width:800,
			height:600,
			title:'pouet',
			layout: {
				type: 'fit',
				align: 'stretch'
			},
			items:[
				Ext.create('Optima5.Modules.CrmBase.AuthAndroidPanel',{
					optimaModule: me.optimaModule
				})
			]
		}) ;
		win.show() ;
	}
}) ;