Ext.define('Optima5.Modules.CrmBase.BibleMemoryPicker',{
	extend:'Ext.form.field.Picker',
	alias: 'widget.op5crmbasebiblememorypicker',
	requires: ['Ext.XTemplate','Ext.grid.Panel'], 
	
	preSubTpl: [
		'<div id="{cmpId}-triggerWrap" data-ref="triggerWrap" class="{triggerWrapCls} {triggerWrapCls}-{ui}">',
			'<div id={cmpId}-inputWrap data-ref="inputWrap" class="{inputWrapCls} {inputWrapCls}-{ui}">'
	],
	
	childEls: ['divicon','divtext'],
	fieldSubTpl: [
		'<div id="{id}" type="{type}" ',
			'<tpl if="size">size="{size}" </tpl>',
			'<tpl if="tabIdx">tabIndex="{tabIdx}" </tpl>',
			'class="{fieldCls} {typeCls} {typeCls}-{ui} {editableCls} {inputCls}" autocomplete="off">',
			'<span id="{cmpId}-divicon" data-ref="divicon" class="biblepicker-icon">&#160;</span>',
			'<span id="{cmpId}-divtext" data-ref="divtext" class="biblepicker-text">&#160;</span>',
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
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:FilePanel','No module reference ?') ;
		}
		
		this.callParent() ;
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action : 'data_getBibleCfg',
				bible_code : this.bibleId
			},
			success: function(response) {
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
				case 'number' :
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
			autoLoad: true,
			proxy: me.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_action: 'data_getBibleGrid' ,
					bible_code: me.bibleId
				},
				reader: {
					type: 'json',
					rootProperty: 'data',
					totalProperty: 'total'
				},
				startParam: undefined,
				limitParam: undefined,
				pageParam: undefined
			}),
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
		
		this.on('destroy',function(c){
			Ext.ux.dams.ModelManager.unregister( c.myModelname ) ;
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
			bufferedRenderer: false,
			// title: 'Simpsons',
			store: me.myStore,
			columns: me.myColumns,
			height: 150,
			width: 200,
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
		var me = this,
			errors = [] ;
		if( Ext.isEmpty(me.myValue) && !me.allowBlank ) {
			errors.push(me.blankText);
		}
		return errors;
	}  
});