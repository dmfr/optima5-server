Ext.define('Optima5.Modules.ParaCRM.BiblePicker',{
	extend:'Ext.form.field.Picker',
	alias: 'widget.op5paracrmbiblepicker',
	requires: ['Ext.XTemplate','Ext.grid.Panel'], 

	fieldSubTpl: [
		'<div id="{id}" type="{type}" ',
			'<tpl if="size">size="{size}" </tpl>',
			'<tpl if="tabIdx">tabIndex="{tabIdx}" </tpl>',
			'class="{fieldCls} {typeCls}" autocomplete="off">',
			'<span id="{cmpId}-divicon" class="biblepicker-icon">&#160;</span>',
			'<span id="{cmpId}-divtext" class="biblepicker-text">&#160;</span>',
		'</div>',
		'<div id="{cmpId}-triggerWrap" class="{triggerWrapCls}" role="presentation">',
			'{triggerEl}',
			'<div class="{clearCls}" role="presentation"></div>',
		'</div>',
		{
			compiled: true,
			disableFormats: true
		}
	],
			  
	

	isFormField: true,
	submitValue: true,
	//resizable: true,
	myValue : '' ,
	
	bibleId: '' ,
	
	initComponent: function() {
		var me = this ;
		this.addEvents('iamready') ;
		this.addChildEls('divicon','divtext') ;
		this.callParent() ;
		
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: {
				_moduleName: 'paracrm',
				_action : 'data_getBibleCfg',
				bible_code : this.bibleId
			},
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == true ) {
					// this.bibleId = bibleId ;
					this.initSetupBible( Ext.decode(response.responseText).data ) ;
				}
				else {
					this.bibleId = '' ;
				}
			},
			scope: this
		});
		
		
	},
	initSetupBible: function( ajaxDataBibleCfg ) {
		var me = this ;
		// me.inputEl.addCls('icon-bible-edit') ;
		//console.dir(me.divicon) ;
		//me.divicon.addCls('biblepicker-iconimg') ;
		// me.inputEl.dom.innerHTML = '<b>ijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsj</b>' ;
		
		this.myModelname = this.id+'-'+'dynModel' ;
		// Création du modèle GRID
		var modelFields = new Array() ;
		var keyfield = '' ;
		Ext.Object.each( ajaxDataBibleCfg.entry_fields , function(k,v) {
			// console.dir(v) ;
			if( !(v.entry_field_is_highlight) && false )
				return ;
			if( v.entry_field_is_key == true )
				keyfield = v.tree_field_code ;
			
			switch( v.entry_field_type )
			{
				case 'numeric' :
				case 'date' :
					var fieldType = v.entry_field_type ;
					break ;
					
				default :
					var fieldType = 'string' ;
					break ;
			}
			
			var fieldObject = new Object();
			Ext.apply(fieldObject,{
				name: v.entry_field_code,
				type: fieldType
			}) ;
			modelFields.push( fieldObject ) ;
		},this) ;
		Ext.define(this.myModelname, {
			extend: 'Ext.data.Model',
			fields: modelFields
		});
		
		
		this.myColumns = new Array() ;
		Ext.Object.each( ajaxDataBibleCfg.entry_fields , function(k,v) {
			// console.dir(v) ;
			if( !(v.entry_field_is_highlight) )
				return ;
			if( !(v.entry_field_is_header) )
				return ;
			
			switch( v.entry_field_type )
			{
				default :
					break ;
			}
			
			var columnObject = new Object();
			Ext.apply(columnObject,{
            text: v.entry_field_lib,
            flex: 1,
            sortable: false,
            dataIndex: v.entry_field_code,
				menuDisabled: true,
				xtype:'gridcolumn'
			}) ;
			this.myColumns.push( columnObject ) ;
		},this) ;
		
		this.myStore = Ext.create('Ext.data.Store', {
			model: this.myModelname,
			//folderSort: true,
			//root: treeroot,
			//clearOnLoad: false,
			autoLoad: true,
			proxy: {
				type: 'ajax',
				url: 'server/backend.php',
				extraParams : {
					_sessionName: op5session.get('session_id'),
					_moduleName: 'paracrm' ,
					_action: 'data_getBibleGrid' ,
					bible_code: this.bibleId
				},
				actionMethods: {
					read:'POST'
				},
				reader: {
					type: 'json',
					root: 'data',
					totalProperty: 'total'
				},
				startParam: undefined,
				limitParam: undefined,
				pageParam: undefined
			},
			listeners: {
				load: {
					fn: function() {
						me.isReady = true ;
						me.fireEvent('iamready') ;
						// me.applyPrettyValue( this.myStore.getRange()[0] ) ;
					},
					options: {
						single: true,
						scope: me
					}
				}
			}
		});
		
		
		me.myStore.on('load',function(){
		},me,{
			single:true
		}) ;
		
		// console.log('finished') ;
		
		this.on('destroy',function(){
			var model = Ext.ModelManager.getModel(this.myModelname);
			Ext.ModelManager.unregister(model);
			// console.log("unregister model "+this.myModelname) ;
		},this) ;
	},
			
	expand: function() {
		var me = this ;
		if( !me.isReady ) {
			me.on('iamready',function(){
				me.expand();
			},me,{
				single:true
			}) ;
			return ;
		}
		
		
		me.myStore.clearFilter() ;
		if( me.getRawValue() != '' ) {
			me.myStore.filter('entry_key',me.getRawValue()) ;
		}
		
		me.clearInvalid() ;
		
		
		this.callParent() ;
		me.getPicker().getDockedItems('toolbar')[0].query('textfield')[0].focus() ;
	},
	collapse: function() {
		var me = this ;
		this.callParent() ;
		me.isValid() ;
		var textfield = me.getPicker().getDockedItems('toolbar')[0].query('textfield')[0] ;
		textfield.setRawValue('') ;
		me.myStore.clearFilter() ;
		// me.myStore.removeAll() ;
	},
	onItemClick: function( picker, record ) {
		var me = this ;
		var oldValue = me.myValue ;
		me.myValue = record.get('entry_key') ;
		this.fireEvent('change',me,me.myValue,oldValue) ;
		me.applyPrettyValue(record) ;
		me.collapse() ;
	},
			  
	createPicker: function() {
		//console.log('created!!') ;
		var me = this ;
		if( !me.isReady ) {
			return null ;
		}

		return Ext.create('Ext.grid.Panel', {
			// title: 'Simpsons',
			store: me.myStore,
			columns: me.myColumns,
			height: 150,
			renderTo: Ext.getBody(),
			floating: true,
			hidden: true,
			focusOnShow: true,
			ownerCt: me.ownerCt,
			pickerField: me,
			tbar : [{
				xtype:'textfield',
				flex:1,
				listeners : {
					change: {
						fn: function(){
							me.onTypeAhead() ;
						},
						scope : me
					}
				}
			},{
				xtype:'button',
				iconCls : 'icon-cancel' ,
				handler : function(button,event) {
					me.setRawValue('') ;
					me.myStore.clearFilter() ;
				},
				scope : me
			}],
			listeners: {
				itemclick: {
					fn: me.onItemClick,
					scope : me
				}
			}
		});

	},
			  
	onTypeAhead: function() {
		var me = this ;
		
		// console.log('wrong place !') ;
		var textfield = me.getPicker().getDockedItems('toolbar')[0].query('textfield')[0] ;
		var mvalue = textfield.getRawValue() ;
		
		
		
		me.myStore.filterBy( function(record) {
			if( mvalue.length < 3 )
				return false ;
			var found = false ;
			Ext.each( me.myColumns , function(col) {
				if( record.get( col.dataIndex ).toLowerCase().indexOf(mvalue.toLowerCase()) != -1 ) {
					found = true ;
				}
			}, me);
			return found ;
		},me ) ;
	},
			  
	applyPrettyValue: function(record) {
		var me = this ;
		
		if( !this.rendered ) {
			me.on('render',function(){
				me.setRawValue(me.getRawValue());
			},me,{
				single:true
			}) ;
			return ;
		}
		
		if( typeof record === "object" ) {
			me.divicon.removeCls('biblepicker-iconimg-nok') ;
			me.divicon.addCls('biblepicker-iconimg-ok') ;
			
			var strArr = new Array() ;
			var val = '' ;
			Ext.each( me.myColumns , function(col) {
				if( val = record.get( col.dataIndex ) ) {
					if( val == record.get('treenode_key') ) {
						strArr.push('('+val+')') ;
					}
					else {
						if( val == record.get('entry_key') ) {
							strArr.push('<b>'+val+'</b>') ;
						}
						else {
							strArr.push(val) ;
						}
					}
				}
			}, me);
			me.divtext.dom.innerHTML = strArr.join(" ") ;
		}
		else {
			me.divicon.removeCls('biblepicker-iconimg-ok') ;
			me.divicon.addCls('biblepicker-iconimg-nok') ;
			if( typeof record === "string" ) {
				me.divtext.dom.innerHTML = record ;
			}
			else {
				me.divtext.dom.innerHTML = '' ;
			}
		}
	},
			  
	setRawValue: function( mvalue ) {
		var me = this ;
		
		if( typeof mvalue === 'undefined' ) {
			return ;
		}
		
		var oldValue = me.myValue ;
		me.myValue = mvalue ;
		this.fireEvent('change',me,me.myValue,oldValue) ;
		
		if( !me.isReady ) {
			me.on('iamready',function(){
				me.setRawValue(me.getRawValue());
			},me,{
				single:true
			}) ;
			return ;
		}
		
		if( !mvalue || mvalue === '' ) {
			me.applyPrettyValue() ;
			return ;
		}
		
		var localResult = me.myStore.findRecord('entry_key',mvalue) ;
		if( localResult != null ) {
			me.applyPrettyValue( localResult ) ;
			return ;
		}
	},
	getRawValue: function() {
		var me = this ;
		return me.myValue ;
	},
	getErrors: function( curvalue ) {
		var errors = this.callParent(arguments) ;
		return errors;
	}  
});