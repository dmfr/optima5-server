Ext.define('Optima5.Modules.CrmBase.DataWindow' ,{
	extend: 'Ext.window.Window',
	requires: [
		'Optima5.Modules.CrmBase.DataWindowToolbar',
		'Optima5.Modules.CrmBase.BiblePanel',
		'Optima5.Modules.CrmBase.FilePanel'
	],
	
	optimaModule: null,
	
	dataType:'', /* 'bible','file' */
	bibleId:null,
	fileId:null,
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:DataWindow','No module reference ?') ;
		}
		
		var cfgValid = false ;
		switch( me.dataType ) {
			case 'bible' :
				if( me.bibleId && me.bibleId != '' ) {
					Ext.apply(me,{
						items:[Ext.create('Optima5.Modules.CrmBase.BiblePanel',{
							itemId:'biblePanel',
							optimaModule: me.optimaModule
						})]
					}) ;
					cfgValid = true ;
				}
				break ;
				
			case 'file' :
				if( me.fileId && me.fileId != '' ) {
					Ext.apply(me,{
						items:[Ext.create('Optima5.Modules.CrmBase.FilePanel',{
							itemId:'filePanel',
							optimaModule: me.optimaModule
						})]
					}) ;
					cfgValid = true ;
				}
				break ;
				
			default : break ;
		}
		if( !cfgValid ) {
			Optima5.Helper.logError('CrmBase:DataWindow','Invalid config') ;
		}
		
		Ext.apply(me,{
			tbar: Ext.create('Optima5.Modules.CrmBase.DataWindowToolbar',{
				itemId:'tbar',
				optimaModule: me.optimaModule,
				dataType: me.dataType,
				listeners:{
					toolbaritemclick: me.onToolbarItemClick,
					scope:me
				}
			})
		}) ;
		
		
		me.on('show', function() {
			// configure panel + load data
			me.configureComponents() ;
		},me,{single:true}) ;
		
		me.callParent() ;
		
		me.mon(me.optimaModule,'op5broadcast',me.onCrmeventBroadcast,me) ;
	},
	onCrmeventBroadcast: function( crmEvent, eventParams ) {
		var me = this ;
		switch( crmEvent ) {
			case 'datachange' :
			case 'definechange' :
			case 'togglepublishdata' :
				switch( eventParams.dataType ) {
					case 'bible' :
						if( me.dataType=='bible' && eventParams.bibleId == me.bibleId ) {
						} else {
							return ;
						}
						break ;
					case 'file' :
						if( me.dataType=='file' && eventParams.fileId == me.fileId ) {
						} else {
							return ;
						}
						break ;
					default :
						return ;
				}
				break ;
			
			default :
				return ;
		}
		
		switch( crmEvent ) {
			case 'togglepublishdata' :
				return me.configureComponents(true) ;
			case 'definechange' :
				return me.configureComponents() ;
			case 'datachange' :
				return me.getPanel().reload() ;
		}
	},
	getToolbar: function() {
		var me = this ;
		return me.child('#tbar');
	},
	getPanel: function() {
		var me = this ;
		switch( me.dataType ) {
			case 'bible' :
				return me.child('#biblePanel') ;
			case 'file' :
				return me.child('#filePanel') ;
			default :
				return null ;
		}
	},
	
	configureComponents: function( toolbarOnly ) {
		var me = this ,
			params = {} ;
		
		switch( me.dataType ) {
			case 'bible' :
				params = {
					_action : 'data_getBibleCfg',
					bible_code : me.bibleId
				};
				break ;
				
			case 'file' :
				params = {
					_action : 'data_getFileGrid_config',
					file_code : me.fileId
				};
				break ;
		}
			
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: params,
			success: function(response) {
				me.onConfigLoad( Ext.decode(response.responseText).data, toolbarOnly ) ;
			},
			scope: me
		});
	},
	onConfigLoad: function( ajaxData, toolbarOnly ) {
		var me = this ;
		switch( me.dataType ) {
			case 'bible' :
				me.setTitle( me.optimaModule.getWindowTitle( ajaxData.define_bible.text ) ) ;
				me.child('#tbar').reconfigure( ajaxData.define_bible ) ;
				if( !toolbarOnly ) {
					me.child('#biblePanel').reconfigure( me.bibleId, ajaxData ) ;
				}
				break ;
			case 'file' :
				me.setTitle( me.optimaModule.getWindowTitle( ajaxData.define_file.text ) ) ;
				me.child('#tbar').reconfigure( ajaxData.define_file ) ;
				if( !toolbarOnly ) {
					me.child('#filePanel').reconfigure( me.fileId, ajaxData ) ;
				}
				break ;
		}
	},
	onToolbarItemClick: function( menuId, menuItemId, checked ) {
		var me = this ;
		//console.log(menuId+':'+menuItemId+' '+checked) ;
		switch( menuId ) {
			case 'file' :
				switch( menuItemId ) {
					case 'export-excel' :
						return me.getPanel().exportExcel() ;
					case 'export-gallery' :
						return me.getPanel().exportGallery() ;
					default : break ;
				}
				break ;
				
			case 'view' :
				switch( menuItemId ) {
					case 'grid' :
					case 'gallery' :
					case 'gmap' :
						var viewmode = menuItemId ;
						return me.getPanel().switchToPanel(viewmode) ;
					default:
						break ;
				}
				break ;
				
			case 'options' :
				switch( menuItemId ) {
					case 'toggle-android' :
						return me.storeTogglePublish( checked ) ;
					case 'definestore' :
						return me.openDefineWindow( false ) ;
					default : break ;
				}
				break ;
		}
	},
	
	openDefineWindow : function(isNew,newDataType) {
		var me = this ;
		
		// console.log( this.activeBibleId ) ;
		
		var params = new Object() ;
		Ext.apply(params,{
			optimaModule: me.optimaModule
		}) ;
		if( isNew == true ){
			Ext.apply( params, {
				defineDataType: newDataType ,
				defineIsNew: true
			}) ;
		}
		else
		{
			switch( me.dataType )
			{
				case 'bible' :
					Ext.apply( params, {
						defineIsNew: false,
						defineDataType: me.dataType ,
						defineBibleId : me.bibleId
					}) ;
				break ;
				
				case 'file' :
					Ext.apply( params, {
						defineIsNew: false,
						defineDataType: me.dataType ,
						defineFileId : me.fileId
					}) ;
				break ;
				
				default:
					Ext.Msg.alert('Status', 'Shouldnt happen !!!');
					return ;
				break ;
			}
		}
		
		var definestorepanel = Ext.create('Optima5.Modules.CrmBase.DefineStorePanel',params) ;
		definestorepanel.on('beforedestroy',function(panel){
			if( panel.up('window') ) {
				var parentwin = panel.up('window') ;
				me.mon(panel,'destroy',function() {
					parentwin.close() ;
				},me) ;
			}
		},me);
		
		me.optimaModule.createWindow({
			title:'Store definition',
			width:620,
			height:600,
			iconCls: 'op5-crmbase-definewindow-icon',
			animCollapse:false,
			border: false,
			items: [ definestorepanel ]
		}) ;
	},
	storeTogglePublish: function( isPublished ) {
		var me = this ;
		
		var ajaxParams = {
			_action : 'define_togglePublish',
			isPublished: isPublished
		};
		switch( this.dataType )
		{
			case 'bible' :
				Ext.apply( ajaxParams, {
					data_type: 'bible',
					bible_code : this.bibleId
				}) ;
			break ;
			
			case 'file' :
				Ext.apply( ajaxParams, {
					data_type: 'file',
					file_code : this.fileId
				}) ;
			break ;
			
			default:
				Ext.Msg.alert('Status', 'Shouldnt happen !!!');
				return ;
			break ;
		}
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				// Rebuild helper on event "toolbarloaded"
				me.optimaModule.postCrmEvent('togglepublishdata',{
					dataType:me.dataType,
					bibleId:me.bibleId,
					fileId:me.fileId
				}) ;
			},
			scope: me
		});
	}
	
});
